import { readFile, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';
import { decode } from 'fast-png';
import assert from 'node:assert/strict';
const receipt = [];
for (const [name, count, folders] of [['mixed-eight', 16, ['Android', 'iOS']], ['offline-ios', 7, ['iOS']]]) {
  const files = unzipSync(await readFile(`output/playwright/${name}.zip`));
  assert.equal(Object.keys(files).length, count);
  const entries = [];
  for (const [path, bytes] of Object.entries(files)) {
    assert.ok(folders.includes(path.split('/')[0]));
    const png = decode(bytes); assert.equal(bytes[24], 8); assert.equal(bytes[25], 2); assert.equal(png.channels, 3);
    const isAndroid = path.startsWith('Android/');
    const size = [png.width, png.height].sort((a, b) => a - b);
    assert.deepEqual(size, isAndroid ? [1080, 1920] : [1320, 2868]);
    entries.push({ path, width: png.width, height: png.height, channels: png.channels });
  }
  if (name === 'mixed-eight') {
    assert.ok(entries.some(e => e.width > e.height)); assert.ok(entries.some(e => e.width < e.height));
    const first = entries.find(e => e.path === 'Android/prueba-agil_01.png'); assert.equal(first.width, 1920);
    const firstPng = decode(files['Android/prueba-agil_01.png']);
    const pixel = (x, y) => [...firstPng.data.slice((y * firstPng.width + x) * 3, (y * firstPng.width + x) * 3 + 3)];
    assert.deepEqual(pixel(40, 40), [0x12, 0x34, 0xab], 'Primary anchors the template background');
    assert.deepEqual(pixel(920, 777), [0xf0, 0xcb, 0x42], 'Secondary accent must be exact');
    await writeFile('output/playwright/landscape.png', files['Android/prueba-agil_01.png']);
  }
  receipt.push({ name, entries });
}
await writeFile('output/playwright/png-receipt.json', JSON.stringify(receipt, null, 2));
console.log('Verified actual downloaded archives: 16 mixed-orientation PNGs and 7 offline iOS PNGs, all RGB without alpha.');
