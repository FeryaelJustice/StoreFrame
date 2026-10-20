# Architecture and contracts

## Static shell

Astro renders `/es/`, `/en/`, ten localized information pages, a root language entry, 404, sitemap and robots. The editor is a React island loaded on the homepages. There is no application backend. Metadata uses `SITE_URL`; the development fallback must be replaced before publishing.

`src/lib/i18n.ts` contains UI text. `src/lib/pages.ts` contains localized information pages and path mapping. System fonts avoid third-party font connections. All device frames and the demo app are original vector/canvas illustrations.

## Editor state

`Shot` couples a stable ID, original File, object URL, decoded dimensions and literal caption. Reordering moves this entire record. `Design` holds the app name, selected platforms, independent device choices per platform, template, independent optional colors, AI selection, a separate AI art direction and an optional creative brief. The preview platform is only a viewing option and does not change selected exports. Selecting a device also switches that viewing option. `src/lib/devices.ts` defines the catalog; see [frame references and approximations](device-frames.md). The same frame renderer runs after either template or AI background composition.

Upload processing decodes each accepted file before adding it. Invalid files produce an actionable error while valid files are retained. File count, individual bytes, decoded pixels and aggregate bytes are bounded. Replacement retains the previous caption. Async upload and generation lock the editing controls.

Any design or shot mutation revokes result URLs and discards the ZIP. Source URLs are revoked on removal/replacement or teardown. Projects are never written to browser storage. The only localStorage preference is `storeframe-theme` (`dark` or `light`). The document defaults to dark and a small inline head script restores a valid saved choice before painting. The shared layout toggle updates every page, synchronizes other tabs and still works for the current visit if storage is blocked. This preference does not mutate editor state or exported pixels. Browser download files remain under user control.

## Graphics and export

`renderComposition` uses one layout coordinate system for preview and final output. The preview is a downscaled drawing of the same composition. Source images use contain fitting with no cropping or aspect ratio changes. The display has a rounded outline and an integrated camera. The intact rectangular source fits within a safe area away from the camera and rounded corners. Small surrounding bands use sampled source-edge colors, with no stretched or regenerated original UI. The full rectangular source remains visible, including its corners. `src/lib/phone.ts` draws the same shaded chassis, optical hardware and screen for picker thumbnails and exported images.

Caption wrapping preserves input characters and explicit newlines. Font size shrinks within a legibility bound. Overflow throws `CaptionOverflow` and blocks export rather than truncating text. A preflight checks every caption before any model download.

The compositor paints an opaque background, optional generated decoration, phone, screen and caption. Without AI, `template-design.ts` paints a uniform Primary field for Clean, a Primary-dominant gradient toward Secondary for Gradient, and a sloping two-color field with fine rules for Editorial. There is no forced white footer. Name and caption ink is selected from white/black by sampling the painted background; a softly feathered Primary veil is used only if neither ink has sufficient contrast across the whole text area. Original screenshots are unchanged. Picker swatches follow the selected brand palette. AI backgrounds use a separate path: full-opacity cover fitting of the real generated image, with no template underlay, luminance recoloring or forced white fade. Adaptive text contrast may add a local feathered veil before the phone is painted. AI result details show the original model image; its object URL is revoked along with outputs on edits or teardown.

Each final canvas is sent to `encode.worker.ts`, converted from RGBA to RGB and encoded through fast-png with three channels and eight bits per channel. The encoder is bundled inline, so starting a fresh worker does not require another network request and works offline after the editor has loaded. The encoder worker is terminated after each image. fflate packs already compressed PNG bytes with ZIP store compression. The ZIP is held in memory and downloaded via an object URL. Its temporary URL is revoked after the download starts.

## AI lifecycle

UI opt-in and generation are both required to start AI. Capability detection checks secure context, WebGPU and OPFS; actual adapter availability is checked by the engine. Each source is sampled at 16x16 to extract up to six dominant quantized colors. A seeded, blurred 512x512 palette moodboard combines these colors with optional brand colors and is transferred locally to a dedicated worker. It contains no recognizable UI. This avoids image-editing models copying a reference screen into the generated background. The original screenshots are kept separately for final composition.

`ai.worker.ts` instantiates flux-klein.js 0.7.0 with local ORT WASM and tokenizer resources. It explicitly selects the streamed mobile engine with `oneThing: true` on all devices, including desktop Chrome, instead of selecting a resident multi-GB transformer by user agent. This uses the same pinned FLUX model revision and existing mobile components, without LoRA. ONNX jobs run in disposable `ai-ort.worker.ts` workers that share the atomic model cache; the engine terminates each job before the next heavy phase. The smaller text encoder keeps its embedding table on disk. Cooldown periods give Chrome time to release WASM memory. The model base URL points to an immutable Hugging Face revision by default. The stock four-step model encodes the palette moodboard at 256x256 and generates one 512x512 artwork, reused for the entire batch. `ai-art.ts` supplies a fresh cryptographic seed for each generation and one of four independent art directions; the template `style` does not enter the prompt. Optional app name, captions, creative brief and natural-language brand color descriptions remain local. The engine has a fixed 128-token prompt budget including its chat wrapper: the real loaded tokenizer measures and fits the prompt so core art/no-interface instructions survive, followed by palette, brief and optional context as space allows. No increase to inference dimensions, steps, model revision or memory strategy is introduced. No LoRA is selected. The worker sends progress events and final RGBA data to the editor. No reference image, text or prompt is sent to a server.

The dedicated worker isolates large CPU/GPU allocations. AbortSignal termination stops its fetches and inference. Normal completion destroys the engine and terminates the worker. Model cache is an application-specific OPFS directory named by revision. The cache deletion control only removes this directory.

Model transfers bypass the browser HTTP cache and use an application OPFS cache. The main AI worker writes the response directly, validates the complete byte count, and then commits a completion marker. Incomplete transfers remain resumable using Range when the server supports it. No incomplete file is accepted by the range reader. Manifest sizes invalidate stale completion markers, Content-Range supplies the full size of partial responses, and download timeouts measure inactivity rather than total transfer time. Valid legacy cache files can be reused after size/ETag validation. The bundled ONNX job worker uses this same cache adapter, avoiding duplicate legacy downloads in nested workers.

Device limits may still reject a GPU or run out of resources. Streaming reduces memory pressure but cannot guarantee that a browser never discards a tab. Recoverable engine errors are surfaced as AI failures with an expandable diagnostic; the user can retry or explicitly choose templates. A browser-level tab discard cannot be caught by JavaScript and still loses this intentionally nonpersistent session. Never silently downgrade an AI result.

## Runtime distribution

`prepare-runtime.mjs` copies the installed tokenizer, flux worker source dependencies and the CPU ORT module/WASM. Only the CPU ORT variant is needed because FLUX's transformer implements WebGPU kernels itself. Large unused ORT JSEP and asyncify artifacts are excluded from copied resources. Build checks reject static files over 25 MiB.

The build generates third-party notices from the exact installed dependency tree. Model weights are not included in `dist` or installed by npm. An operator may mirror the pinned model tree with compatible CORS and byte-range support. See deployment instructions.

## Hero examples

The two hero cards use static, localized RGB PNG exports in `public/hero/`. They are generated by the real editor with the fictional demo screen: Galaxy S26 with Gradient (`#1e4038` / `#93ab80`), and iPhone 17 with Editorial (`#526a48` / `#e2d4a5`). Their full compositions, device proportions and captions are preserved; the website only scales and rotates the exported images. The old independent CSS phone illustration has been removed from the hero.

After renderer changes, build and serve the current editor, run `tests/generate-hero-assets.cjs` through the documented Playwright CLI workflow, then rebuild to include the refreshed PNGs. Run `tests/hero-flow.cjs` to check both locales/themes and five viewport sizes. Asset generation uses local templates and never starts AI inference.
