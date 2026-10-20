import { surface } from './render';
import { abortIfNeeded, type Shot, type Design } from './project';
import { artRequest } from './ai-art';
import { CACHE_DIR } from './model-config';
import type { ProgressEvent } from 'flux-klein.js';
let activeWorker: Worker | undefined;
export function supportsAI() { return Boolean(navigator.gpu && typeof navigator.storage?.getDirectory === 'function' && window.isSecureContext); }
export async function clearModelCache() {
  activeWorker?.terminate(); activeWorker = undefined;
  const root = await navigator.storage.getDirectory();
  try { await root.removeEntry(CACHE_DIR, { recursive: true }); }
  catch (error) { if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error; }
}
export async function generateBackground(shots: Shot[], design: Design, signal: AbortSignal, onEvent: (event: ProgressEvent) => void) {
  if (!supportsAI()) throw new Error('WebGPU or OPFS unavailable');
  abortIfNeeded(signal);
  const art = artRequest(design, shots);
  // Give the image model a palette moodboard, never a recognizable UI to copy.
  // The original screenshots are still composited intact after inference.
  const moodboard = surface(512, 512); const ctx = moodboard.getContext('2d')!;
  const colors: string[] = [];
  const sample = surface(16, 16); const sampleCtx = sample.getContext('2d', { willReadFrequently: true })!;
  try {
    for (const shot of shots) {
      abortIfNeeded(signal); const bitmap = await createImageBitmap(shot.file);
      try {
        sampleCtx.fillStyle = '#ffffff'; sampleCtx.fillRect(0, 0, 16, 16);
        sampleCtx.drawImage(bitmap, 0, 0, 16, 16);
        const pixels = sampleCtx.getImageData(0, 0, 16, 16).data;
        const bins = new Map<string, number>();
        for (let i = 0; i < pixels.length; i += 4) {
          const color = '#' + [...pixels.slice(i, i + 3)].map(v => Math.min(255, Math.round(v / 24) * 24).toString(16).padStart(2, '0')).join('');
          bins.set(color, (bins.get(color) || 0) + 1);
        }
        colors.push(...[...bins].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([color]) => color));
      } finally { bitmap.close(); }
    }
    if (art.primary) colors.push(art.primary, art.primary, art.primary);
    if (art.secondary) colors.push(art.secondary, art.secondary);
    let random = art.seed || 1;
    const next = () => { random ^= random << 13; random ^= random >>> 17; random ^= random << 5; return (random >>> 0) / 4294967296; };
    ctx.fillStyle = colors[0] || '#889988'; ctx.fillRect(0, 0, 512, 512);
    ctx.filter = 'blur(24px)';
    for (let row = -1; row < 5; row++) for (let col = -1; col < 5; col++) {
      ctx.fillStyle = colors[Math.floor(next() * colors.length)] || '#889988';
      ctx.fillRect(col * 128 - 16, row * 128 - 16, 160, 160);
    }
    ctx.filter = 'none';
  } catch (error) { moodboard.width = moodboard.height = 0; throw error; }
  finally { sample.width = sample.height = 0; }
  const bitmap = await createImageBitmap(moodboard); moodboard.width = moodboard.height = 0;
  if (signal.aborted) { bitmap.close(); abortIfNeeded(signal); }
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const worker = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }); activeWorker = worker;
    const finish = () => { signal.removeEventListener('abort', cancel); worker.terminate(); if (activeWorker === worker) activeWorker = undefined; };
    const cancel = () => { finish(); reject(new DOMException('Cancelled', 'AbortError')); };
    signal.addEventListener('abort', cancel, { once: true });
    worker.onerror = event => { finish(); reject(new Error(event.message)); };
    worker.onmessage = event => {
      if (event.data.progress) { onEvent(event.data.progress); return; }
      finish();
      if (event.data.error) { reject(new Error(event.data.error)); return; }
      const { width, height, rgba } = event.data;
      const result = surface(width, height); result.getContext('2d')!.putImageData(new ImageData(rgba, width, height), 0, 0); resolve(result);
    };
    worker.postMessage({ reference: bitmap, art, origin: location.origin }, [bitmap]);
  });
}
