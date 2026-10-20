import { readFile, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import { decode } from 'fast-png';
import assert from 'node:assert/strict';
const receipt = [];
for (const style of ['clean', 'gradient', 'editorial', 'editorial-light']) {
  const files = unzipSync(await readFile(`output/playwright/template-${style}.zip`));
  assert.equal(Object.keys(files).length, 4);
  for (const [path, bytes] of Object.entries(files)) {
    const png = decode(bytes), { width, height, data } = png;
    const size = path.startsWith('Android/') ? [1080, 1920] : [1320, 2868];
    const landscape = path.endsWith('_02.png');
    assert.deepEqual([width, height], landscape ? size.reverse() : size);
    assert.equal(png.channels, 3); assert.equal(bytes[24], 8); assert.equal(bytes[25], 2);
    const pixel = (x, y) => [...data.slice((Math.floor(y * height) * width + Math.floor(x * width)) * 3, (Math.floor(y * height) * width + Math.floor(x * width)) * 3 + 3)];
    const primary = [18, 52, 171], secondary = [240, 203, 66];
    assert.deepEqual(pixel(.02, .02), primary, 'Primary anchors every template');
    const corners = [[.02, .02], [.98, .02], [.02, .98], [.98, .98]].map(([x, y]) => pixel(x, y));
    if (style === 'clean') corners.forEach(c => assert.deepEqual(c, primary, 'Clean is solid Primary'));
    else {
      const end = style === 'gradient' || landscape ? pixel(.98, .32) : pixel(.98, .98), delta = (a, b) => a.reduce((n, value, i) => n + Math.abs(value - b[i]), 0);
      assert.ok(delta(end, secondary) < delta(end, primary), 'Secondary field stays visible outside the caption contrast veil');
      assert.ok(!corners.some(c => c.every(channel => channel > 245)), 'No artificial white footer');
    }
    let left = width, right = -1, top = height, bottom = -1;
    const red = (x, y) => { const i = (y * width + x) * 3; return data[i] > 245 && data[i + 1] < 8 && data[i + 2] >= 25 && data[i + 2] < 35; };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (red(x, y)) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
    for (const [x, y] of [[left + 1, top + 1], [right - 1, top + 1], [left + 1, bottom - 1], [right - 1, bottom - 1]]) assert.ok(red(x, y), 'Complete source corner visible');
    if (path === 'Android/marca_01.png') await writeFile(`output/playwright/template-${style}.png`, bytes);
    receipt.push({ style, path, width, height, corners });
  }
}
const dark = unzipSync(await readFile('output/playwright/template-editorial.zip'));
const light = unzipSync(await readFile('output/playwright/template-editorial-light.zip'));
for (const name of Object.keys(dark)) assert.deepEqual(dark[name], light[name], 'Site theme never changes exported PNGs');
await writeFile('output/playwright/template-receipt.json', JSON.stringify(receipt, null, 2));
console.log('Verified sixteen RGB PNGs, brand backgrounds, complete source corners and identical exports across website themes.');
