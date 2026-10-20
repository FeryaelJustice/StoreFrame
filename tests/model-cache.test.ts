import { afterEach, describe, expect, it, vi } from 'vitest';
import { modelCache } from '../src/lib/model-cache';
import { cacheKey } from 'flux-klein.js/cache';

function memoryStorage() {
  const files = new Map<string, Uint8Array>();
  const bytes = (value: unknown) => typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value as ArrayBuffer);
  const directory = {
    async getDirectoryHandle() { return directory; },
    async getFileHandle(name: string, options?: { create?: boolean }) {
      if (!files.has(name)) { if (!options?.create) throw new Error('Not found'); files.set(name, new Uint8Array()); }
      return {
        async getFile() { return new File([new Uint8Array(files.get(name)!)], name); },
        async createWritable() { return { async write(value: unknown) { files.set(name, bytes(value)); }, async close() {} }; },
        async createSyncAccessHandle() { return {
          truncate(length: number) { files.set(name, files.get(name)!.slice(0, length)); },
          write(value: Uint8Array, { at }: { at: number }) {
            const previous = files.get(name)!; const next = new Uint8Array(Math.max(previous.length, at + value.byteLength));
            next.set(previous); next.set(value, at); files.set(name, next); return value.byteLength;
          }, flush() {}, close() {},
        }; },
      };
    },
    async removeEntry(name: string) { files.delete(name); },
  };
  vi.stubGlobal('navigator', { storage: { getDirectory: async () => directory } });
  return files;
}
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('Atomic model cache', () => {
  it('allows a progressing transfer to take longer than sixty seconds', async () => {
    vi.useFakeTimers(); memoryStorage();
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') return new Response(null, { headers: { 'Content-Length': '2' } });
      const signal = init!.signal!;
      let sent = 0;
      return new Response(new ReadableStream({
        async pull(controller) {
          if (sent === 2) { controller.close(); return; }
          await new Promise(resolve => setTimeout(resolve, 45000));
          if (signal.aborted) { controller.error(signal.reason); return; }
          controller.enqueue(new Uint8Array([++sent]));
        },
      }), { headers: { 'Content-Length': '2' } });
    }));
    const pending = modelCache().cachedFetch('https://models.example/slow', { retries: 0 });
    const assertion = expect(pending.then(value => new Uint8Array(value!))).resolves.toEqual(new Uint8Array([1, 2]));
    await vi.advanceTimersByTimeAsync(91000); await assertion;
  });
  it('replaces a completed but truncated shard using its manifest size when HEAD hides length', async () => {
    const files = memoryStorage(); const url = 'https://models.example/truncated'; const key = cacheKey(url) + '.sf';
    files.set(key, new Uint8Array([1, 2])); files.set(key + '.complete', new TextEncoder().encode('2'));
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'HEAD'
      ? new Response(null)
      : new Response(new Uint8Array([1, 2, 3, 4]), { headers: { 'Content-Length': '4' } })));
    const cache = modelCache();
    expect(await cache.cachedRange(url, 0, 2, { size: 4 })).toBeNull();
    await cache.cachedFetch(url, { noData: true, retries: 0 });
    expect(new Uint8Array((await cache.cachedRange(url, 0, 4, { size: 4 }))!)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });
  it('uses the total from Content-Range when HEAD hides length', async () => {
    memoryStorage(); let downloads = 0;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') return new Response(null);
      const start = downloads++ * 2;
      return new Response(new Uint8Array([start + 1, start + 2]), { status: 206, headers: { 'Content-Length': '2', 'Content-Range': `bytes ${start}-${start + 1}/4` } });
    }));
    const cache = modelCache();
    expect(new Uint8Array((await cache.cachedFetch('https://models.example/ranged', { retries: 0 }))!)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });
  it('rejects a wrong initial byte range without committing it', async () => {
    const files = memoryStorage();
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'HEAD'
      ? new Response(null)
      : new Response(new Uint8Array([3, 4]), { status: 206, headers: { 'Content-Range': 'bytes 2-3/4' } })));
    await expect(modelCache().cachedFetch('https://models.example/wrong', { retries: 0 })).rejects.toThrow('Invalid model range');
    expect([...files.keys()].some(k => k.endsWith('.complete'))).toBe(false);
  });
  it('commits a complete transfer and serves it without another network request', async () => {
    memoryStorage();
    const network = vi.fn(async (_url: string, init?: RequestInit) => init?.method === 'HEAD' ? new Response(null, { headers: { 'Content-Length': '4', ETag: 'v1' } }) : new Response(new Uint8Array([1, 2, 3, 4]), { headers: { 'Content-Length': '4' } }));
    vi.stubGlobal('fetch', network); const cache = modelCache();
    expect(new Uint8Array((await cache.cachedFetch('https://models.example/file'))!)).toEqual(new Uint8Array([1, 2, 3, 4]));
    const calls = network.mock.calls.length;
    await cache.cachedFetch('https://models.example/file'); expect(network.mock.calls).toHaveLength(calls);
    expect(new Uint8Array((await cache.cachedRange('https://models.example/file', 1, 2, { size: 4 }))!)).toEqual(new Uint8Array([2, 3]));
    expect(await cache.cachedRange('https://models.example/file', 0, 2, { size: 5 })).toBeNull();
  });
  it('rejects an incomplete file and resumes it without accepting a completion marker', async () => {
    const files = memoryStorage(); let downloads = 0;
    const network = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') return new Response(null, { headers: { 'Content-Length': '6', ETag: 'v1' } });
      downloads++;
      if (downloads === 1) return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Length': '6' } });
      expect(new Headers(init?.headers).get('Range')).toBe('bytes=3-');
      return new Response(new Uint8Array([4, 5, 6]), { status: 206, headers: { 'Content-Length': '3', 'Content-Range': 'bytes 3-5/6' } });
    });
    vi.stubGlobal('fetch', network); const cache = modelCache();
    await expect(cache.cachedFetch('https://models.example/file', { retries: 0 })).rejects.toThrow('Incomplete');
    expect([...files.keys()].some(k => k.endsWith('.complete'))).toBe(false);
    expect(await cache.cachedRange('https://models.example/file', 0, 2, { size: 6 })).toBeNull();
    expect(new Uint8Array((await cache.cachedFetch('https://models.example/file', { retries: 0 }))!)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  });
});
