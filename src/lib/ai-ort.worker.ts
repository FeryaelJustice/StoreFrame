import * as ort from 'onnxruntime-web/wasm';
import { modelCache } from './model-cache';

type Feed = { type: ort.Tensor.Type; data: Float32Array; dims: number[] };
type Job = {
  wasmPaths: string; threads: number; modelUrl: string; dataUrl?: string;
  feeds: Record<string, Feed> | Record<string, Feed>[];
  opts?: ort.InferenceSession.SessionOptions; parts?: boolean; label: string;
};

// flux-klein.js job protocol, using the same atomic cache as the parent worker.
// Each job is terminated by the engine after completion, releasing its WASM heap.
self.onmessage = async ({ data: job }: MessageEvent<Job>) => {
  let session: ort.InferenceSession | undefined;
  const log = (text: string) => self.postMessage({ log: text });
  try {
    ort.env.wasm.wasmPaths = job.wasmPaths;
    const cache = modelCache();
    const data = (await cache.cachedFetch(job.dataUrl || job.modelUrl, {
      onProgress: (loaded, total, cached) => {
        if (!cached) self.postMessage({ log: `${job.label}: ${Math.round(loaded / 1048576)}/${Math.round(total / 1048576)} MB` });
      },
    }))!;
    const create = (threads: number) => {
      ort.env.wasm.numThreads = threads;
      const options: ort.InferenceSession.SessionOptions = {
        executionProviders: ['wasm'], graphOptimizationLevel: 'all',
        ...(job.dataUrl ? { externalData: [{ path: 'model.onnx.data', data }] } : {}),
        ...job.opts,
      };
      return job.dataUrl ? ort.InferenceSession.create(job.modelUrl, options) : ort.InferenceSession.create(new Uint8Array(data), options);
    };
    log(`${job.label}: creating session`);
    try { session = await create(job.threads); }
    catch (error) { if (job.threads <= 1) throw error; session = await create(1); }
    // ORT owns a copy now; release the downloaded JS buffer before inference.
    try { data.transfer?.(0); } catch { /* Older browsers release it on worker termination. */ }
    const list = Array.isArray(job.feeds) ? job.feeds : [job.feeds];
    const outs: ort.Tensor.DataType[] = [];
    for (let i = 0; i < list.length; i++) {
      const feeds: Record<string, ort.Tensor> = {};
      for (const [name, feed] of Object.entries(list[i])) feeds[name] = new ort.Tensor(feed.type, feed.data, feed.dims);
      log(`${job.label}: running ${i + 1}/${list.length}`);
      const out = (await session.run(feeds))[session.outputNames[0]].data;
      if (job.parts) self.postMessage({ part: i, out }, { transfer: ArrayBuffer.isView(out) ? [out.buffer as ArrayBuffer] : [] }); else outs.push(out);
    }
    self.postMessage(job.parts ? { ok: true } : Array.isArray(job.feeds) ? { ok: true, outs } : { ok: true, out: outs[0] });
  } catch (error) { self.postMessage({ ok: false, error: String(error) }); }
  finally { await session?.release(); }
};
