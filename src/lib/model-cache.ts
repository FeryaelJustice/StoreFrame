import { createCache, cacheKey } from 'flux-klein.js/cache';
import type { Cache } from 'flux-klein.js';
import { CACHE_DIR } from './model-config';

/** Immutable model assets use OPFS directly in the AI worker. No nested writer workers. */
export function modelCache(): Cache {
  const original = createCache({ dir: CACHE_DIR });
  const selected = new Map<string, string>();
  const sizes = new Map<string, number>();
  const directory = async () => (await navigator.storage.getDirectory()).getDirectoryHandle(CACHE_DIR, { create: true });
  const text = async (root: FileSystemDirectoryHandle, name: string) => {
    try { return await (await (await root.getFileHandle(name)).getFile()).text(); } catch { return ''; }
  };
  const metadata = async (root: FileSystemDirectoryHandle, name: string, value: string) => {
    const handle = await root.getFileHandle(name, { create: true }); const writer = await handle.createWritable(); await writer.write(value); await writer.close();
  };
  const file = async (root: FileSystemDirectoryHandle, name: string) => {
    try { return await (await root.getFileHandle(name)).getFile(); } catch { return undefined; }
  };
  const fetchAsset: Cache['cachedFetch'] = async (url, opts = {}) => {
    const root = await directory(); const key = cacheKey(url); const ownKey = key + '.sf';
    const cached = await file(root, ownKey); const completed = Number(await text(root, ownKey + '.complete'));
    if (cached && completed && cached.size === completed && (!sizes.has(url) || cached.size === sizes.get(url))) { selected.set(url, ownKey); opts.onProgress?.(cached.size, cached.size, true); return opts.noData ? null : cached.arrayBuffer(); }
    // A stale completion marker must never validate a failed replacement transfer.
    try { await root.removeEntry(ownKey + '.complete'); } catch {}
    selected.delete(url);
    let size = sizes.get(url) || 0, etag = '';
    try { const head = await fetch(url, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(15000) }); if (head.ok) { size ||= Number(head.headers.get('content-length')) || 0; etag = head.headers.get('etag') || ''; } } catch {}
    const legacy = await file(root, key);
    if (legacy && size && legacy.size === size && etag && await text(root, key + '.etag') === etag) {
      selected.set(url, key); opts.onProgress?.(legacy.size, legacy.size, true); return opts.noData ? null : legacy.arrayBuffer();
    }
    for (let attempt = 0; ; attempt++) {
      let close: (() => Promise<void>) | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let transfer: AbortController;
      const watch = () => { clearTimeout(timeout); timeout = setTimeout(() => transfer.abort(new DOMException('Model download stalled', 'TimeoutError')), 60000); };
      try {
        const partial = await file(root, ownKey);
        let start = size && etag && partial && partial.size < size && await text(root, ownKey + '.part') === etag ? partial.size : 0;
        const segment = (offset: number) => {
          transfer = new AbortController(); watch();
          return fetch(url, {
          cache: 'no-store', signal: transfer.signal,
          ...(size > 16 * 1048576 ? { headers: { Range: `bytes=${offset}-${Math.min(offset + 16 * 1048576 - 1, size - 1)}` } } : offset ? { headers: { Range: `bytes=${offset}-` } } : {}),
          });
        };
        let response = await segment(start);
        if (!response.ok || !response.body) throw new Error(`Model download HTTP ${response.status}`);
        const range = response.headers.get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
        if (response.status === 206 && (!range || Number(range[1]) !== start || Number(range[2]) < start || Number(range[2]) >= Number(range[3]) || (size && Number(range[3]) !== size))) {
          await response.body.cancel(); throw new Error('Invalid model range response');
        }
        if (start && response.status !== 206) start = 0;
        // Content-Length on a 206 describes only this segment, never the whole asset.
        const expected = size || (range ? Number(range[3]) : Number(response.headers.get('content-length')) || 0);
        size = expected;
        if (etag) await metadata(root, ownKey + '.part', etag);
        const handle = await root.getFileHandle(ownKey, { create: true });
        let at = start;
        let write: (value: Uint8Array) => Promise<void>;
        // The dedicated AI worker can write directly, avoiding orphaned nested writers.
        try {
          const sync = await (handle as FileSystemFileHandle & { createSyncAccessHandle(): Promise<{ truncate(n: number): void; write(data: Uint8Array, opts: { at: number }): number; flush(): void; close(): void }> }).createSyncAccessHandle();
          if (!start) sync.truncate(0);
          write = async value => { if (sync.write(value, { at }) !== value.byteLength) throw new Error('Short OPFS write'); };
          close = async () => { sync.flush(); sync.close(); };
        } catch {
          const stream = await handle.createWritable({ keepExistingData: Boolean(start) }); if (start) await stream.seek(start);
          write = async value => { await stream.write(new Uint8Array(value)); }; close = () => stream.close();
        }
        let lastProgress = 0;
        try {
          while (true) {
            if (!response.body) throw new Error('Model response has no body');
            const segmentStart = at; const segmentLength = Number(response.headers.get('content-length')) || 0;
            const reader = response.body.getReader();
            try {
              while (true) {
                // Bound inactivity, not total transfer time on a slow connection.
                watch();
                const { done, value } = await reader.read(); if (done) break;
                await write(value); at += value.byteLength;
                const now = performance.now();
                if (now - lastProgress >= 120 || at === expected) { opts.onProgress?.(at, expected, false); lastProgress = now; }
              }
            } finally { clearTimeout(timeout); await reader.cancel().catch(() => {}); reader.releaseLock(); }
            if (segmentLength && at - segmentStart !== segmentLength) throw new Error(`Incomplete model segment: ${at - segmentStart}/${segmentLength}`);
            if (!expected || at >= expected || response.status !== 206) break;
            response = await segment(at);
            const nextRange = response.headers.get('content-range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
            if (!response.ok || response.status !== 206 || !nextRange || Number(nextRange[1]) !== at || Number(nextRange[2]) < at || Number(nextRange[2]) >= expected || Number(nextRange[3]) !== expected) {
              await response.body?.cancel(); throw new Error('Invalid model range response');
            }
          }
        } finally { await close(); close = undefined; }
        if (expected && at !== expected) throw new Error(`Incomplete model transfer: ${at}/${expected}`);
        await metadata(root, ownKey + '.complete', String(at));
        try { await root.removeEntry(ownKey + '.part'); } catch {}
        selected.set(url, ownKey);
        const downloaded = await (await root.getFileHandle(ownKey)).getFile();
        return opts.noData ? null : downloaded.arrayBuffer();
      } catch (error) {
        clearTimeout(timeout);
        await close?.();
        if (error instanceof DOMException && ['QuotaExceededError', 'NotAllowedError'].includes(error.name)) throw error;
        if (attempt >= (opts.retries ?? 2)) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      } finally { clearTimeout(timeout); }
    }
  };
  const cachedRange: Cache['cachedRange'] = async (url, offset, length, opts = {}) => {
    if (opts.size) sizes.set(url, opts.size);
    const root = await directory(); const key = cacheKey(url);
    for (const name of selected.has(url) ? [selected.get(url)!] : [key + '.sf', key]) {
      const source = await file(root, name); if (!source || source.size < offset + length || (opts.size && source.size !== opts.size)) continue;
      if (!selected.has(url)) {
        const verified = name.endsWith('.sf') ? Number(await text(root, name + '.complete')) === source.size : Boolean(opts.size && await text(root, name + '.etag'));
        if (!verified) continue;
      }
      selected.set(url, name); return source.slice(offset, offset + length).arrayBuffer();
    }
    return null;
  };
  return { ...original, cachedFetch: fetchAsset, cachedRange };
}
