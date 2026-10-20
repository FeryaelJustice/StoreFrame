# Verification guide

## Automated checks

`npm run check` checks TypeScript, JSX and Astro. TypeScript is pinned to 6.0.3 because the selected Astro checker does not support TypeScript 7.

`npm test` validates safe naming, ordering with captions, store dimensions, contain fitting, RGB PNG bytes including transparent input, ZIP platform folders for eight-image sets, optional hex colors, atomic model-cache completion, and recovery of partial transfers. Cache unit tests use a synthetic filesystem/network; they do not validate image inference.

`npm run build` generates static pages, local runtime resources and license notices. It fails when an output asset exceeds the Cloudflare Pages 25 MiB limit.

## Browser checks

Use the production build with `npm run serve` and a clean browser context. Use the public illustration via 'Try an example' or test fixtures that contain no personal information. The CLI used during development is available with `npx playwright-cli`.

1. Verify the empty editor, generated preview and disabled generation action.
2. Add one image; inspect the Play two-image minimum notice. Generate Android only, download and inspect the ZIP.
3. Add eight images with distinct filenames and captions. Include portrait and landscape sources. Choose both platforms, reorder and replace screenshots, then export all 16 results.
4. Confirm each PNG's decoded dimensions, bit depth 8 and PNG IHDR color type 2. Verify only selected folders exist and filenames follow editor order.
5. Check that source edges remain visible, images are not stretched, captions preserve punctuation/newlines, and supplied colors appear exactly in painted accents.
6. Edit a caption/name/color/style after generation. Confirm previous results and ZIP disappear. Test blank name and blank captions.
7. Try corrupt bytes, unsupported files, nine inputs, oversized files and overlong captions. Errors must be visible and controls must recover.
8. Test generation cancellation, then regenerate successfully. Generate with network offline after resources are loaded. Verify no template workflow requests leave the origin, and no request carries screenshots or captions.
9. Switch languages and visit every footer page. Check the translated navigation, alternate URLs, canonical URLs, contact details, sitemap and robots.
10. At mobile widths of 375-390px, verify no horizontal overflow, usable controls, result previews and downloads. Check keyboard focus, labels, heading order and reduced motion.

## Device selection regression

After building and serving, run `node scripts/create-fixtures.mjs`, open `/es/` in a clean Playwright CLI session, run `tests/device-frames-flow.cjs`, then run `node scripts/inspect-device-exports.mjs`.

The browser flow exports all seven models across four downloaded ZIPs with both orientations and platforms. It checks invalidation, independent choices, platform-toggle retention, AI-toggle retention, English controls, mobile picker bounds and absence of template uploads or third-party requests. The independent decoder checks exact dimensions, RGB/depth/no-alpha, distinct model outputs, complete red source corners and aspect ratios. Inspect exported images and `devices-mobile.png` visually. This does not run actual AI inference; use the real AI checks below for that.

## Real AI checks

Only an actual image generation validates the AI path. Unit tests, mocked workers and WebGPU availability alone are insufficient.

1. On compatible hardware, choose the example screenshot, enable AI and generate. Verify local runtime files, fixed-revision model downloads, reference encoding, four denoising steps and final background composition.
2. Download both platform results and inspect that the exact original screen and caption are above the generated background.
3. Generate again and inspect OPFS cache reuse. Record browser/GPU where available, time, output evidence and limitations; do not imply universal compatibility.
4. Cancel during an actual download or inference. The AI worker must terminate and the editor must become usable. Retry.
5. Test a failed model request and a context without WebGPU. Both must provide an explicit path to templates and must not label template output as AI.
6. Clear the cache with confirmation and inspect storage. Only the StoreFrame model cache should be removed.

Screenshots, ZIP samples and logs belong in ignored `output/playwright/`. Record the final observed outcome in `docs/validation.md`.

## Reproducible CLI flows

With `npm run serve` running, create nonpersonal fixtures and start the browser:

```sh
node scripts/create-fixtures.mjs
npx playwright-cli -s=storeframe open http://127.0.0.1:4322/es/
npx playwright-cli -s=storeframe snapshot
npx playwright-cli -s=storeframe run-code --filename=tests/browser-flow.cjs
node scripts/inspect-exports.mjs
npx playwright-cli -s=storeframe run-code --filename=tests/pages-flow.cjs
npx playwright-cli -s=storeframe run-code --filename=tests/fallback-flow.cjs
```

`tests/start-ai.cjs` starts a real opt-in model run. Let it finish before switching the browser context offline. The offline flow disconnects the complete browser context, including other tabs. Do not run those two flows concurrently. Capture and inspect actual AI outputs separately; starting a run is not a passing inference result.


## AI memory and failure regression

The AI now uses the streaming engine on desktop as well. Run an actual cold generation and a cached repeat; verify both outputs, download the ZIP, and check that the app name, screenshot and caption remain present. Streaming and cooldowns may be slower than the resident desktop engine. Existing desktop cache files do not replace the distinct streamed model files, so the first run after this change may download additional weights.

Run `tests/ai-failure-flow.cjs` in a separate browser session. It blocks model downloads deliberately, verifies the expanded network diagnostic and retained form, then generates a template. This simulation does not establish GPU inference or survival under operating-system memory exhaustion. Do not disconnect the browser context used for a real AI run when executing offline template tests.

After a successful real run, execute `tests/ai-cached-flow.cjs` in the same persistent browser session. It performs real inference, asserts no weight downloads or upload methods, verifies retained fields, and saves `output/playwright/ai-streamed-cached.zip`. Its 180-second wait is a test limit, not a product performance promise.


For visual review with the fictional app, run `tests/device-appearance-flow.cjs` in the same production browser session. It downloads `device-appearance.zip`, captures the real picker and produces `mockup-preview.png` from the two exported devices. Compare rounded screen outlines, camera placement, thin rails and model-specific corners against the supplied visual reference. This is appearance verification, not image inference.

## Theme and template regression

With the production server running and fixtures generated, run `tests/theme-templates-flow.cjs` in a real Playwright CLI session, then `node scripts/inspect-template-exports.mjs`. The flow verifies dark by default even with a light system preference, localStorage restoration after reload, bilingual/information-page navigation, cross-tab updates, blocked storage, header fit at 375px/390px, retained projects and output downloads across theme changes, no runtime errors and no upload/third-party requests in the template workflow.

Four downloaded archives cover Clean, Gradient, Editorial and Editorial repeated with the website's light theme. The independent decoder checks all sixteen PNG dimensions, RGB/depth/no alpha, uniform Clean corners and visible Primary/Secondary fields outside the text contrast veil, absence of a forced white footer, complete original source corners and byte-identical editorial PNGs across UI themes. `tests/template-appearance-flow.cjs` generates the fictional demo for all three styles and saves `output/playwright/templates-preview.png` for visual review. These tests do not execute AI inference.

## Creative AI background acceptance

`tests/start-creative-ai.cjs` starts a real generation in the selected browser session using the fictional demo, emerald/gold colors and a sculptural brief. Keep the same persistent profile to reuse weights. Check progress without reloading or disconnecting that context. On completion, run `tests/save-creative-ai.cjs`, inspect `ai-creative-background.png` and the composed Android/iOS images visually, and run `node scripts/inspect-ai-art.mjs` to decode the downloaded ZIP. This checks dimensions/RGB and compares background pixels against the original generated artwork with interpolation tolerance, outside device/text regions.

`tests/ai-controls-flow.cjs` checks bilingual independent creative controls and restores the retained template selection when AI is switched off. `tests/ai-compositor-flow.cjs` runs against the existing development server at port 4321 and uses a synthetic checkerboard to prove full opacity, unchanged artwork colors and identical composition across template-style values in AI mode. The synthetic compositor test is not inference evidence. `tests/ai-art.test.ts` uses the pinned actual tokenizer to verify that essential art/no-interface instructions and optional content fit the engine's 128-token context.

Visually inspect a real background for tangible forms, motifs or texture and absence of copied UI. A successful inference can still produce an unwanted image; prompts and the abstract palette reference reduce this risk but do not guarantee every generation's appearance. Only the selected creative directions that were actually generated and inspected can be reported as perceptually verified.


For the default AI flow, keep the same test project, choose automatic inspiration, clear the creative brief and Generate again. `tests/save-creative-ai.cjs` saves automatic results with the `ai-auto` prefix. Run `node scripts/inspect-ai-art.mjs ai-auto` and inspect both the raw artwork and compositions. A successful preset run alone does not validate automatic art direction.
