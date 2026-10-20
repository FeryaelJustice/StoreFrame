import type { Style } from './project';

export function mix(a: string, b: string, amount: number): string {
  return '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - amount) + parseInt(b.slice(i, i + 2), 16) * amount).toString(16).padStart(2, '0')).join('');
}
export function luminance(hex: string): number {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
export function inkFor(color: string) { return contrast('#ffffff', color) >= contrast('#000000', color) ? '#ffffff' : '#000000'; }

export function paintTemplate(ctx: CanvasRenderingContext2D, width: number, height: number, style: Style, primary: string, secondary: string) {
  ctx.fillStyle = primary; ctx.fillRect(0, 0, width, height);
  if (style === 'clean') return;
  if (style === 'gradient') {
    // A restrained side glow keeps the primary and the caption area dominant.
    ctx.save(); ctx.scale(width, height);
    const g = ctx.createRadialGradient(1.03, .32, 0, 1.03, .32, .72);
    g.addColorStop(0, secondary); g.addColorStop(.25, mix(primary, secondary, .65));
    g.addColorStop(.66, mix(primary, secondary, .22)); g.addColorStop(1, primary);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 1); ctx.restore();
    return;
  }
  // Editorial uses a sloping color field and fine rules, without a white footer.
  const g = ctx.createLinearGradient(width * .18, height * .42, width * .48, height * .94);
  g.addColorStop(0, primary); g.addColorStop(.30, primary);
  g.addColorStop(.53, mix(primary, secondary, .45)); g.addColorStop(.73, secondary); g.addColorStop(1, secondary);
  ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
  ctx.save(); ctx.strokeStyle = secondary; ctx.globalAlpha = .65; ctx.lineWidth = Math.max(1, width * .001);
  ctx.beginPath(); ctx.moveTo(width * .065, height * .025); ctx.lineTo(width * .22, height * .025); ctx.stroke();
  ctx.strokeStyle = primary; ctx.globalAlpha = .22;
  ctx.beginPath(); ctx.moveTo(width * .065, height * .79); ctx.lineTo(width * .935, height * .67); ctx.stroke(); ctx.restore();
}

// Read the actual painted background, so preview and export choose the same text color.
// A feathered brand-colored veil handles extreme palettes without a rectangular text panel.
export function templateTextInk(ctx: CanvasRenderingContext2D, scale: number, x: number, y: number, width: number, height: number, primary: string) {
  const colors: string[] = [];
  for (const dx of [.05, .25, .5, .75, .95]) for (const dy of [.05, .5, .95]) {
    const pixel = ctx.getImageData(Math.min(ctx.canvas.width - 1, Math.floor((x + width * dx) * scale)), Math.min(ctx.canvas.height - 1, Math.floor((y + height * dy) * scale)), 1, 1).data;
    colors.push('#' + [...pixel.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join(''));
  }
  const inks = ['#ffffff', '#000000'];
  const score = (ink: string) => Math.min(...colors.map(c => contrast(ink, c)));
  const ink = score(inks[0]) >= score(inks[1]) ? inks[0] : inks[1];
  if (score(ink) >= 4.5) return ink;
  const safeInk = inkFor(primary);
  const tint = mix(primary, safeInk === '#ffffff' ? '#000000' : '#ffffff', .15);
  const rgb = [1, 3, 5].map(i => parseInt(tint.slice(i, i + 2), 16)).join(',');
  ctx.save(); ctx.translate(x + width / 2, y + height / 2); ctx.scale(width * .85, height * 1.3);
  const veil = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  veil.addColorStop(0, `rgba(${rgb},.96)`); veil.addColorStop(.76, `rgba(${rgb},.96)`); veil.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = veil; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  return safeInk;
}
