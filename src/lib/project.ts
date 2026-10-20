import { DEFAULT_DEVICES, type DeviceId } from './devices';
export type Lang = 'es' | 'en';
export type Platform = 'Android' | 'iOS';
export type Style = 'clean' | 'gradient' | 'editorial';
export type AiDirection = 'auto' | 'sculptural' | 'geometric' | 'organic';
export interface Shot { id: string; file: File; url: string; width: number; height: number; caption: string }
export interface Design { appName: string; platforms: Platform[]; devices: Record<Platform, DeviceId>; style: Style; primary: string; secondary: string; useAI: boolean; aiDirection: AiDirection; aiBrief: string }
export interface Output { platform: Platform; name: string; url: string; png: Uint8Array; width: number; height: number; caption: string }
export const MAX_SHOTS = 8;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PIXELS = 24_000_000;
export const MAX_BATCH_BYTES = 100 * 1024 * 1024;
export const DEFAULT_DESIGN: Design = { appName: '', platforms: ['Android'], devices: { ...DEFAULT_DEVICES }, style: 'gradient', primary: '', secondary: '', useAI: false, aiDirection: 'auto', aiBrief: '' };
export function slug(name: string): string {
  const safe = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64).replace(/-+$/g, '');
  return safe || 'app';
}
export function filename(name: string, index: number) { return `${slug(name)}_${String(index + 1).padStart(2, '0')}.png`; }
export function dimensions(platform: Platform, landscape: boolean): [number, number] {
  const size: [number, number] = platform === 'Android' ? [1080, 1920] : [1320, 2868];
  return landscape ? [size[1], size[0]] : size;
}
export function contain(sw: number, sh: number, x: number, y: number, w: number, h: number) {
  const k = Math.min(w / sw, h / sh);
  return { x: x + (w - sw * k) / 2, y: y + (h - sh * k) / 2, w: sw * k, h: sh * k };
}
export function move<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy;
}
export function validColor(color: string) { return color === '' || /^#[0-9a-f]{6}$/i.test(color); }
export function palette(design: Pick<Design, 'primary' | 'secondary'>) {
  return { primary: design.primary || '#303632', secondary: design.secondary || '#e8e7e1', custom: Boolean(design.primary || design.secondary) };
}
export function isSupportedFile(type: string) { return ['image/png', 'image/jpeg', 'image/webp'].includes(type); }
export function abortIfNeeded(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); }
export function rgbaToRgb(data: Uint8ClampedArray | Uint8Array) {
  const out = new Uint8Array(data.length / 4 * 3);
  for (let i = 0, j = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255;
    out[j++] = Math.round(data[i] * a + 255 * (1 - a));
    out[j++] = Math.round(data[i + 1] * a + 255 * (1 - a));
    out[j++] = Math.round(data[i + 2] * a + 255 * (1 - a));
  }
  return out;
}
