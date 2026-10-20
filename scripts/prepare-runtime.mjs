import { mkdir, cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const runtime = 'public/runtime';
await mkdir(`${runtime}/ort`, { recursive: true });
const fluxRoot = dirname(require.resolve('flux-klein.js/package.json'));
const ortRoot = dirname(dirname(require.resolve('onnxruntime-web')));
await cp(join(fluxRoot, 'src'), `${runtime}/flux/src`, { recursive: true });
// Keep HTTP caches out of model storage. OPFS validates the weights itself, and
// an interrupted HTTP 200 stream must not be replayed as a complete shard.
const workerPath = `${runtime}/flux/src/ort-worker.js`;
const workerSource = await readFile(workerPath, 'utf8');
await writeFile(workerPath, `// Modified by StoreFrame: use OPFS, not the HTTP cache, for model downloads.\nconst storeframeFetch = globalThis.fetch.bind(globalThis);\nglobalThis.fetch = (input, init) => storeframeFetch(input, { ...init, cache: 'no-store' });\n${workerSource}`);
await cp(join(fluxRoot, 'tokenizer'), `${runtime}/tokenizer`, { recursive: true });
// The CPU wasm runtime is the only ORT backend needed by flux-klein.js.
// Copying JSEP/asyncify adds unnecessary files larger than the Pages 25 MiB limit.
for (const name of ['ort.wasm.min.mjs', 'ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) {
  await cp(join(ortRoot, 'dist', name), `${runtime}/ort/${name}`);
}
const notices = ['StoreFrame third-party notices\nGenerated from the exact installed dependency tree. Model weights are downloaded separately.\n'];
async function walkModules(root) {
  let names; try { names = await readdir(root, { withFileTypes: true }); } catch { return; }
  for (const entry of names) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const path = join(root, entry.name);
    if (entry.name.startsWith('@')) { await walkModules(path); continue; }
    try {
      const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
      const files = await readdir(path);
      const licenseFiles = files.filter(name => /^(license|licence|notice|copying)(\.|$)/i.test(name));
      if (licenseFiles.length) {
        notices.push(`\n\n${pkg.name} ${pkg.version} (${pkg.license || 'see license'})\n`);
        for (const file of licenseFiles) { try { notices.push(`\n${file}\n${await readFile(join(path, file), 'utf8')}\n`); } catch {} }
      }
    } catch {}
    await walkModules(join(path, 'node_modules'));
  }
}
await walkModules('node_modules');
await mkdir('public/licenses', { recursive: true });
await writeFile('public/licenses/THIRD-PARTY-NOTICES.txt', notices.join(''));
console.log('Prepared local AI runtime, tokenizer and third-party licenses.');
