import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.SITE_URL || 'https://storeframe.example',
  output: 'static',
  integrations: [react()],
  vite: {
    resolve: { conditions: ['onnxruntime-web-use-extern-wasm'] },
    worker: { format: 'es' },
    optimizeDeps: { exclude: ['flux-klein.js', 'onnxruntime-web'] },
    server: { headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    } },
    build: { assetsInlineLimit: 0 },
  },
});
