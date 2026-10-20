import { contain } from './project';
import type { Device } from './devices';

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number | number[]) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
}

// A single renderer serves picker thumbnails, previews and final compositions.
// All dimensions below are in the device's portrait millimetre coordinate system.
export function drawPhone(ctx: CanvasRenderingContext2D, image: CanvasImageSource, sw: number, sh: number, d: Device, landscape: boolean, x: number, y: number, scale: number) {
  ctx.save(); ctx.translate(x, y);
  if (landscape) { ctx.translate(d.height * scale, 0); ctx.rotate(Math.PI / 2); }
  ctx.scale(scale, scale);
  const w = d.width, h = d.height;
  const metal = ctx.createLinearGradient(0, 0, w, h * .2);
  metal.addColorStop(0, '#16191c'); metal.addColorStop(.035, '#e0e3e5');
  metal.addColorStop(.08, d.rim); metal.addColorStop(.2, '#43494e');
  metal.addColorStop(.52, '#aeb4b9'); metal.addColorStop(.82, '#262b30');
  metal.addColorStop(.965, d.rim); metal.addColorStop(1, '#101317');
  ctx.fillStyle = metal;
  // The buttons protrude only a fraction of the side rail thickness.
  for (const [bx, by, bh] of d.platform === 'iOS' ? [[w - .25, h * .29, 13], [-.55, h * .19, 3.4], [-.55, h * .27, 7], [-.55, h * .34, 7]] : [[w - .25, h * .24, 10], [w - .25, h * .35, 16]]) {
    rounded(ctx, bx, by, .8, bh, .35); ctx.fill();
  }
  ctx.save(); ctx.shadowColor = 'rgba(8,14,20,.3)'; ctx.shadowBlur = 4 * scale; ctx.shadowOffsetY = 1.5 * scale;
  rounded(ctx, 0, 0, w, h, d.radius); ctx.fill(); ctx.restore();
  // Successive narrow highlights give the side rail a rounded machined edge.
  for (const [inset, color, line] of [[.18, '#171c21', .22], [.42, '#d3d8db', .16], [.76, '#34393e', .23]] as const) {
    rounded(ctx, inset, inset, w - inset * 2, h - inset * 2, d.radius - inset);
    ctx.strokeStyle = color; ctx.lineWidth = line; ctx.stroke();
  }
  const glass = .95;
  rounded(ctx, glass, glass, w - glass * 2, h - glass * 2, d.radius - glass);
  ctx.fillStyle = '#080a0d'; ctx.fill();
  const b = d.bezel, screenW = w - b * 2, screenH = h - b * 2;
  const cameraY = d.camera === 'notch' ? b : b + 2;
  const cameraH = d.camera === 'hole' ? d.cameraWidth : d.camera === 'notch' ? 4.7 : 4.8;
  // A rectangle inset by r * (1 - 1/sqrt(2)) fits inside all four rounded corners.
  const cornerInset = (d.radius - b) * (1 - Math.SQRT1_2) + .25;
  const topInset = Math.max(cornerInset, cameraY + cameraH + .9 - b);
  const bottomInset = Math.max(cornerInset, 1.3);
  ctx.save(); rounded(ctx, b, b, screenW, screenH, Math.max(.5, d.radius - b)); ctx.clip();
  ctx.translate(b, b);
  // Rotate only the content coordinate system back, leaving camera and chassis rotated.
  if (landscape) { ctx.translate(0, screenH); ctx.rotate(-Math.PI / 2); }
  const displayW = landscape ? screenH : screenW, displayH = landscape ? screenW : screenH;
  const fit = landscape
    ? contain(sw, sh, bottomInset, cornerInset, displayW - bottomInset - topInset, displayH - cornerInset * 2)
    : contain(sw, sh, cornerInset, topInset, displayW - cornerInset * 2, displayH - topInset - bottomInset);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  // Extend only narrow edge samples behind the intact original. The display is rounded,
  // but the complete original stays inside its safe rectangle, away from camera/corners.
  const sx = Math.min(sw - 1, Math.max(1, Math.floor(sw * .04))), sy = Math.min(sh - 1, Math.max(1, Math.floor(sh * .04)));
  const mx = Math.floor(sw / 2), my = Math.floor(sh / 2);
  ctx.drawImage(image, mx, sy, 1, 1, 0, 0, displayW, displayH);
  ctx.drawImage(image, mx, sh - sy - 1, 1, 1, 0, fit.y + fit.h, displayW, displayH - fit.y - fit.h);
  ctx.drawImage(image, sx, my, 1, 1, 0, fit.y, fit.x, fit.h);
  ctx.drawImage(image, sw - sx - 1, my, 1, 1, fit.x + fit.w, fit.y, displayW - fit.x - fit.w, fit.h);
  ctx.drawImage(image, 0, 0, sw, sh, fit.x, fit.y, fit.w, fit.h);
  ctx.restore();
  // Optical hardware sits inside the display glass, above the extended edge area.
  ctx.fillStyle = '#020305';
  const cameraX = (w - d.cameraWidth) / 2;
  if (d.camera === 'hole') { ctx.beginPath(); ctx.arc(w / 2, cameraY + cameraH / 2, cameraH / 2, 0, Math.PI * 2); ctx.fill(); }
  else { rounded(ctx, cameraX, cameraY, d.cameraWidth, cameraH, d.camera === 'notch' ? [0, 0, 2.4, 2.4] : cameraH / 2); ctx.fill(); }
  const lensX = d.camera === 'hole' ? w / 2 : cameraX + d.cameraWidth - 2.5, lensY = cameraY + cameraH / 2;
  const lens = ctx.createRadialGradient(lensX - .2, lensY - .2, .05, lensX, lensY, .95);
  lens.addColorStop(0, '#26394e'); lens.addColorStop(.4, '#0c192b'); lens.addColorStop(.75, '#090d17'); lens.addColorStop(1, '#151922');
  ctx.fillStyle = lens; ctx.beginPath(); ctx.arc(lensX, lensY, .95, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(139,170,215,.45)'; ctx.beginPath(); ctx.arc(lensX - .25, lensY - .25, .17, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
