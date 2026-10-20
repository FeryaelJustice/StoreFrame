import { zipSync } from 'fflate';
import { abortIfNeeded, type Output } from './project';
import EncodeWorker from './encode.worker?worker&inline';
export async function encodePng(canvas: HTMLCanvasElement, signal: AbortSignal): Promise<Uint8Array> {
  abortIfNeeded(signal);
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    const worker = new EncodeWorker();
    const finish = () => { signal.removeEventListener('abort', cancel); worker.terminate(); };
    const cancel = () => { finish(); reject(new DOMException('Cancelled', 'AbortError')); };
    signal.addEventListener('abort', cancel, { once: true });
    worker.onerror = event => { finish(); reject(new Error(event.message)); };
    worker.onmessage = event => { finish(); event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.png); };
    worker.postMessage({ rgba: pixels.data, width: canvas.width, height: canvas.height }, [pixels.data.buffer]);
  });
}
export function makeZip(outputs: Output[]) {
  const files: Record<string, Uint8Array> = {};
  for (const output of outputs) files[`${output.platform}/${output.name}`] = output.png;
  return zipSync(files, { level: 0 });
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
