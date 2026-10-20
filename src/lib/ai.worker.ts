import { createFluxKlein } from 'flux-klein.js';
import * as ort from 'onnxruntime-web/wasm';
import { PreTrainedTokenizer } from '@huggingface/transformers';
import { CACHE_DIR, MODEL_BASE } from './model-config';
import { artPrompt, type ArtRequest } from './ai-art';
import { cacheKey } from 'flux-klein.js/cache';
import { modelCache } from './model-cache';
import ortWorkerUrl from './ai-ort.worker.ts?worker&url';
self.onmessage = async (event: MessageEvent<{ reference: ImageBitmap; art: ArtRequest; origin: string }>) => {
  const { reference: image, art, origin } = event.data;
  const fetchWeights: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });
  let engine;
  try {
    engine = await createFluxKlein({
      // Stream weights on desktops too: the resident engine can make Chrome discard
      // the entire tab under memory pressure, including the unsaved editor.
      base: MODEL_BASE, mode: 'mobile', oneThing: true, cache: modelCache(), ort, fetchImpl: fetchWeights,
      wasmPaths: `${origin}/runtime/ort/`, threads: crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1,
      PreTrainedTokenizer, tokenizerUrl: `${origin}/runtime/tokenizer/`, decoder: 'full',
      workerUrl: `${origin}${ortWorkerUrl}`, ortUrl: `${origin}/runtime/ort/ort.wasm.min.mjs`,
      onEvent: progress => self.postMessage({ progress }),
    });
    const reference = await engine.encodeReference(image, { width: 256, height: 256 }); image.close();
    const tokenizer = engine.pipeline.tok;
    const tokenize = tokenizer as unknown as (text: string, options: { truncation: boolean; padding: boolean }) => { input_ids: { data: ArrayLike<number> } };
    const tokenCount = (prompt: string) => tokenize(tokenizer.apply_chat_template([{ role: 'user', content: prompt }], { tokenize: false, add_generation_prompt: true, enable_thinking: false }), { padding: false, truncation: false }).input_ids.data.length;
    const result = await engine.generate({ prompt: artPrompt(art, tokenCount), reference, width: 512, height: 512, steps: 4, seed: art.seed });
    self.postMessage({ rgba: result.rgba, width: result.width, height: result.height }, { transfer: [result.rgba.buffer] });
  } catch (error) {
    // Some download hosts hide Content-Length. Do not reuse a shard that the
    // model manifest has identified as truncated after an interrupted download.
    const truncated = String(error).match(/(https?:\/\/\S+): got \d+ bytes, manifest implies \d+/);
    if (truncated) {
      try {
        const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(CACHE_DIR);
        const key = cacheKey(truncated[1]);
        await root.removeEntry(key + '.etag');
      } catch { /* An absent cache entry already forces a fresh download. */ }
    }
    self.postMessage({ error: String(error) });
  }
  finally { image.close(); engine?.destroy(); }
};
