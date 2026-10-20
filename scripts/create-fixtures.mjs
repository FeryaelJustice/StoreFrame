import { mkdir, writeFile } from 'node:fs/promises';
import { encode } from 'fast-png';
await mkdir('output/playwright/fixtures', { recursive: true });
for (let i = 0; i < 9; i++) {
  const landscape = i % 2 === 1; const width = landscape ? 844 : 390, height = landscape ? 390 : 844;
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const j = (y * width + x) * 3; const edge = x < 8 || y < 8 || x > width - 9 || y > height - 9;
    data[j] = edge ? 255 : 40 + i * 18; data[j + 1] = edge ? 0 : 90 + Math.round(y / height * 80); data[j + 2] = edge ? 30 : 150 + i * 8;
  }
  await writeFile(`output/playwright/fixtures/screen-${i + 1}.png`, encode({ width, height, data, channels: 3, depth: 8 }));
}
await writeFile('output/playwright/fixtures/corrupt.png', 'not a png');
await writeFile('output/playwright/fixtures/unsupported.txt', 'not an image');
console.log('Nine mixed-orientation PNG fixtures plus corrupt/unsupported files created.');
