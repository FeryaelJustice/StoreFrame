import { dimensions, palette, type Design, type Platform } from './project';
import { deviceFor, deviceLayout } from './devices';
import { drawPhone } from './phone';
import { paintTemplate, templateTextInk } from './template-design';

export class CaptionOverflow extends Error {}
type Surface = HTMLCanvasElement;
export function surface(width: number, height: number): Surface {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; return canvas;
}
function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}
export function textLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph) { lines.push(''); continue; }
    let line = '';
    for (const character of Array.from(paragraph)) {
      if (line && ctx.measureText(line + character).width > maxWidth) {
        const split = line.lastIndexOf(' ');
        if (split > line.length * 0.5) { lines.push(line.slice(0, split + 1)); line = line.slice(split + 1); }
        else { lines.push(line); line = ''; }
      }
      line += character;
    }
    lines.push(line);
  }
  return lines;
}
function caption(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, w: number, h: number, size: number, strict: boolean) {
  if (!value) return;
  let lines: string[] = []; let font = size;
  const minimum = Math.max(18, size * 0.52);
  while (font >= minimum) {
    ctx.font = `600 ${font}px Arial, sans-serif`;
    lines = textLines(ctx, value, w);
    if (lines.length * font * 1.28 <= h && lines.every(line => ctx.measureText(line).width <= w + 1)) break;
    font -= 1;
  }
  if (font < minimum) { if (strict) throw new CaptionOverflow(); return; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x + w / 2, y + i * font * 1.28);
}
export async function renderComposition(args: {
  image: CanvasImageSource; sourceWidth: number; sourceHeight: number; caption: string;
  platform: Platform; design: Design; background?: HTMLCanvasElement; previewWidth?: number; strict?: boolean;
}): Promise<HTMLCanvasElement> {
  const { image, sourceWidth: sw, sourceHeight: sh, platform, design, background } = args;
  const landscape = sw > sh; const [W, H] = dimensions(platform, landscape);
  const scale = args.previewWidth ? Math.min(1, args.previewWidth / W) : 1;
  const c = surface(Math.round(W * scale), Math.round(H * scale)); const ctx = c.getContext('2d', { alpha: false, willReadFrequently: true })!;
  ctx.scale(scale, scale); const p = palette(design);
  if (design.useAI) {
    // Honest neutral preflight/preview until real inference returns. No template underlay.
    ctx.fillStyle = p.primary; ctx.fillRect(0, 0, W, H);
    if (background) {
      const k = Math.max(W / background.width, H / background.height);
      ctx.drawImage(background, (W - background.width * k) / 2, (H - background.height * k) / 2, background.width * k, background.height * k);
    }
  } else paintTemplate(ctx, W, H, design.style, p.primary, p.secondary);
  const name = design.appName;
  if (name) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    let fs = W * (landscape ? .018 : .027); ctx.font = `600 ${fs}px Arial, sans-serif`;
    while (ctx.measureText(name).width > W * .84 && fs > 12) { fs--; ctx.font = `600 ${fs}px Arial, sans-serif`; }
    const textWidth = ctx.measureText(name).width + W * .02;
    ctx.fillStyle = templateTextInk(ctx, scale, (W - textWidth) / 2, H * .045, textWidth, fs * 1.3, p.primary);
    ctx.fillText(name, W / 2, H * .045);
  }
  const device = deviceFor(platform, design.devices[platform]);
  // Paint any contrast veil before the phone, so it can never cover source pixels.
  const captionInk = !args.caption ? '#202b25' : templateTextInk(ctx, scale, W * .075, H * (landscape ? .745 : .83), W * .85, H * (landscape ? .24 : .15), p.primary);
  const frame = deviceLayout(device, landscape, W * (landscape ? .68 : .78), H * (landscape ? .60 : .70));
  const x = (W - frame.width) / 2, y = H * (landscape ? .075 : .09);
  drawPhone(ctx, image, sw, sh, device, landscape, x, y, frame.scale);
  // Exact brand accents are painted after the generated background.
  ctx.fillStyle = design.useAI || design.style === 'editorial' ? p.primary : p.secondary; round(ctx, W * .46, H * (landscape ? .715 : .813), W * .08, Math.max(4, W * .005), W * .003); ctx.fill();
  if (design.useAI && design.secondary) { ctx.fillStyle = design.secondary; ctx.fillRect(W * .55, H * (landscape ? .715 : .813), W * .018, Math.max(4, W * .005)); }
  ctx.fillStyle = captionInk;
  caption(ctx, args.caption, W * .09, H * (landscape ? .76 : .845), W * .82, H * (landscape ? .20 : .13), W * (landscape ? .030 : .049), args.strict ?? true);
  return c;
}
