import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';
import { decode } from 'fast-png';
import assert from 'node:assert/strict';
const receipt = [];
const hashes = { Android: new Set(), iOS: new Set() };
for (let batch = 0; batch < 4; batch++) {
  const files = unzipSync(await readFile(`output/playwright/devices-${batch}.zip`));
  assert.equal(Object.keys(files).length, 4);
  for (const [path, bytes] of Object.entries(files)) {
    const png = decode(bytes), { width, height, data } = png;
    const platform = path.split('/')[0], landscape = path.endsWith('_02.png');
    const size = platform === 'Android' ? [1080, 1920] : [1320, 2868];
    assert.deepEqual([width, height], landscape ? size.reverse() : size);
    assert.equal(bytes[24], 8); assert.equal(bytes[25], 2); assert.equal(png.channels, 3);
    let left = width, right = -1, top = height, bottom = -1;
    const red = (x, y) => { const i = (y * width + x) * 3; return data[i] > 245 && data[i + 1] < 8 && data[i + 2] >= 25 && data[i + 2] < 35; };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (red(x, y)) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    assert.ok(right > left && bottom > top, 'Source border is present');
    for (const [x, y] of [[left + 1, top + 1], [right - 1, top + 1], [left + 1, bottom - 1], [right - 1, bottom - 1]]) assert.ok(red(x, y), `${path}: source corner visible`);
    const expectedRatio = landscape ? 844 / 390 : 390 / 844;
    assert.ok(Math.abs((right - left + 1) / (bottom - top + 1) - expectedRatio) < .015, 'Source aspect ratio preserved');
    if (!landscape) hashes[platform].add(createHash('sha256').update(bytes).digest('hex'));
    if (batch === 0 || batch === 3) await writeFile(`output/playwright/device-${batch}-${platform}-${landscape ? 'landscape' : 'portrait'}.png`, bytes);
    receipt.push({ batch, path, width, height, sourceBounds: { left, right, top, bottom } });
  }
}
assert.equal(hashes.Android.size, 3, 'Three distinct Android frames, repeated S26 is deterministic');
assert.equal(hashes.iOS.size, 4, 'Four distinct iPhone frames');
await writeFile('output/playwright/device-receipt.json', JSON.stringify(receipt, null, 2));
console.log('Verified 16 RGB PNGs, exact store dimensions, 7 distinct models, complete source corners and preserved aspect ratios in both orientations.');
