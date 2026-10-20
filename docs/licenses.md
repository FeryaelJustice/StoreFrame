# Third-party licensing

## Model and engine

- FLUX.2 klein 4B, Black Forest Labs: Apache License 2.0. Source and license: https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/blob/main/LICENSE.md
- Browser weights: quantized adaptation by radames, pinned to revision `e8f306c29bae4ea18a4d81a3d79507d91e05e94f`. The model card links its model license to the original Apache 2.0 license. https://huggingface.co/radames/flux2-klein-edge-web
- flux-klein.js 0.7.0: MIT, Copyright 2026 Radames Ajna. Installed package license is included in generated notices. https://www.npmjs.com/package/flux-klein.js
- ONNX Runtime Web: MIT. Transformers.js: Apache License 2.0. Their notices are retained with the installed dependencies.

The model weights are downloaded separately and are not committed or shipped inside the app build. A mirror must preserve the model's provenance, licenses and required attribution. Apache 2.0 permits use and redistribution subject to its terms; do not confuse this 4B model with noncommercial FLUX variants. This implementation does not enable extra LoRA weights.

## Site dependencies

Astro, its React integration, React, fast-png and fflate use MIT licenses. TypeScript, Vitest, Playwright and the other development dependencies retain their own licenses. `scripts/prepare-runtime.mjs` collects root-level license and notice files from the installed dependency tree into `public/licenses/THIRD-PARTY-NOTICES.txt`, which is served from the licenses page.

The demo screen is fictional, and the phone illustrations and graphic composition are original project assets. System fonts are used without external font requests. StoreFrame does not use Apple or Google logos, product photos or third-party phone mockup packs. Product names identify the illustrated devices and do not imply endorsement. See [device references and asset provenance](device-frames.md). Publicly available code or images are not automatically free of copyright; no external frame pack was incorporated.

Do not infer that supplying source code here grants additional permissions over all project material. No unsolicited project-wide open-source license has been assigned to the user's own work. Third-party license obligations apply independently.
