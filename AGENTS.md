# StoreFrame agent instructions

Read `C:\Users\nano9\.agents\AGENTS.md` for shared policy when working with skills, MCPs or agent configuration. Canonical shared skills live in `C:\Users\nano9\.agents\skills`.

## Authorized architecture

- No SDD. Astro static output, React editor, TypeScript. No uploads, remote inference endpoints, accounts, analytics or paid APIs.
- Do not publish, connect accounts, start trials or incur charges without a direct user request.
- The UI is bilingual. Keep Spanish and English controls, pages and metadata equivalent.
- Use plain hyphens in authored text. Do not use em dashes or en dashes.
- Keep original screenshots and literal captions. Never send them off-device or let the image model redraw them.
- Templates are not AI. Preserve explicit mode labels and the opt-in model download explanation.

## Key contracts

- 1-8 PNG/JPEG/WebP inputs; decoded dimension and resource limits in `src/lib/project.ts`.
- Android: 1080x1920; iOS: 1320x2868; reverse for landscape.
- Final PNG: RGB, depth 8, color type 2, no alpha. Canvas's ordinary PNG encoder is insufficient for this contract.
- ZIP folder names: `Android`, `iOS`. Filenames: normalized app slug plus `_01.png`, in editor order. Default slug: `app`.
- Any edit invalidates outputs. Dispose object URLs, bitmaps, canvases and workers. Do not persist projects.
- Keep model revision and dependency versions pinned. Audit licenses before switching model components. Never silently replace the model with a text-only model or remote service.

## Workflow and verification

Read README and `docs/architecture.md` before changing the editor or pipeline. Run `npm run check`, `npm test` and `npm run build` for relevant changes. For export/interaction changes, also follow `docs/testing.md` with a real browser and downloaded ZIP. A build, unit test or mocked worker does not validate image inference.

Generated files in `dist`, `.astro`, `public/runtime`, `public/licenses/THIRD-PARTY-NOTICES.txt` and `output` are not source. `scripts/prepare-runtime.mjs` creates runtime resources from the installed lockfile dependencies. Never remove licenses from vendored resources.

Document validation limits accurately in `docs/validation.md`. Do not claim GPU generation passed without an actual generated background. Keep missing deployment identity or hardware limits separate from code failures.
