import { readdir, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function walk(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if ((await stat(path)).size > 25 * 1024 * 1024) throw new Error(`Asset exceeds Cloudflare Pages limit: ${path}`);
  }
}
await walk('dist');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
if (sitemap.includes('storeframe.example')) console.warn('Before publishing: set SITE_URL to your actual origin, then rebuild.');
console.log('Static output checked: every asset is below 25 MiB.');
