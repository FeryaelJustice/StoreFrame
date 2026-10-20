import { readFile, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import { decode } from 'fast-png';
import assert from 'node:assert/strict';
const prefix = process.argv[2] || 'ai-creative';
assert.match(prefix, /^[a-z0-9-]+$/);
const rawBytes = await readFile(`output/playwright/${prefix}-background.png`);
const raw = decode(rawBytes);
assert.deepEqual([raw.width, raw.height, raw.channels, rawBytes[24], rawBytes[25]], [512, 512, 3, 8, 2]);
const files = unzipSync(await readFile(`output/playwright/${prefix}.zip`));
assert.equal(Object.keys(files).length, 2);
const receipt = [];
for (const [path, bytes] of Object.entries(files)) {
  const png = decode(bytes), W = png.width, H = png.height;
  assert.deepEqual([W, H], path.startsWith('Android/') ? [1080, 1920] : [1320, 2868]);
  assert.deepEqual([png.channels, bytes[24], bytes[25]], [3, 8, 2]);
  const k = Math.max(W / raw.width, H / raw.height), ox = (W - raw.width * k) / 2, oy = (H - raw.height * k) / 2;
  const reference = (x, y) => {
    const u = (x + .5 - ox) / k - .5, v = (y + .5 - oy) / k - .5;
    const left = Math.floor(u), top = Math.floor(v), fx = u - left, fy = v - top;
    const pixel = (x, y, c) => raw.data[(Math.max(0, Math.min(511, y)) * 512 + Math.max(0, Math.min(511, x))) * 3 + c];
    return [0, 1, 2].map(c => Math.round(pixel(left, top, c) * (1 - fx) * (1 - fy) + pixel(left + 1, top, c) * fx * (1 - fy) + pixel(left, top + 1, c) * (1 - fx) * fy + pixel(left + 1, top + 1, c) * fx * fy));
  };
  let maximumDelta = 0;
  for (const nx of [.02, .98]) for (const ny of [.15, .30, .55]) {
    const x = Math.floor(nx * W), y = Math.floor(ny * H), expected = reference(x, y);
    const actual = [...png.data.slice((y * W + x) * 3, (y * W + x) * 3 + 3)];
    const delta = Math.max(...actual.map((v, i) => Math.abs(v - expected[i])));
    maximumDelta = Math.max(maximumDelta, delta);
    assert.ok(delta <= 4, `${path}: generated colors changed beyond scaling interpolation (${delta})`);
  }
  await writeFile(`output/playwright/${prefix}-${path.split('/')[0]}.png`, bytes);
  receipt.push({ path, width: W, height: H, channels: png.channels, maximumBackgroundDelta: maximumDelta });
}
await writeFile(`output/playwright/${prefix}-receipt.json`, JSON.stringify(receipt, null, 2));
console.log('Verified actual AI exports: RGB without alpha, exact store sizes, generated background colors preserved outside text and device.');
