# Validation receipt

Date: 19 October 2026. Local Windows environment, Node.js 24.21.0. Production preview at `http://127.0.0.1:4322`. No public deployment, paid inference or account connection was performed.

## Verified application behavior

- TypeScript/Astro check: zero errors, zero warnings, zero hints.
- Nine unit tests pass across export contracts and atomic model-cache recovery. Synthetic cache tests are not evidence of image inference.
- Static production build succeeds. Fourteen HTML pages plus robots and sitemap are emitted. Every static file is below 25 MiB.
- Real browser: one source image exported to both Android and iOS, downloaded as a ZIP and decoded independently.
- Real browser: eight mixed-orientation sources exported to sixteen PNGs, with reordered captions and normalized filename `prueba-agil_01.png`.
- Actual downloaded ZIPs decoded: all PNGs have bit depth 8, color type 2, three channels and the exact platform dimensions in the appropriate orientation.
- Pixel checks confirm exact primary `#1234ab` and secondary `#f0cb42` accents. Source borders remain visible in the inspected landscape output.
- Actual offline export: seven iOS PNGs downloaded with the browser context disconnected from the network after loading the editor.
- Old results disappear after editing. Long captions, a ninth input, corrupt bytes, unsupported file types and invalid colors are rejected visibly. Replacing a screenshot retains its caption.
- No-GPU simulation produces the explicit template recovery action. The subsequent result is labeled as a template without AI. This simulation is not a real GPU benchmark.
- Template generation cancellation recovers without exposing partial results.
- Twelve localized home/information pages return HTTP 200, use the correct document language and have headings without horizontal overflow in the tested layout.
- Mobile layouts inspected at 390px and 375px. Reduced-motion navigation checked. Production WASM MIME type and cross-origin isolation confirmed.
- Template request monitoring observed only local GET/HEAD requests and local blob downloads, with no image or caption upload request.
- Cache deletion tested through the confirmation dialog. The model directory was removed and the success message appeared. No unrelated origin storage was deleted.

## AI verification

Real GPU inference passed in Chrome 155 on Windows, with an NVIDIA Ampere adapter and a separate persistent browser profile. No model output was mocked.

- The fixed-revision model was downloaded, a local source montage was encoded, and the model ran its four-step generation. Visible states included `Generando fondo 1/4`, `Generando fondo 4/4`, decoding, and both export steps.
- The completed run produced two outputs labeled `Fondo generado con IA local`. The downloaded `ai-real.zip` contains Android 1080x1920 and iOS 1320x2868 PNGs. Independent decoding confirmed three RGB channels and color type 2.
- Visual inspection confirmed a generated decorative background, the complete source rectangle including its colored border, the frame and the supplied caption. The source was not replaced by the model output.
- A second real generation using the complete local cache produced both outputs in 39.611 seconds in this specific test. Request monitoring recorded no `.bin`/`.onnx.data` weight transfers and no upload methods. This observation is not a performance guarantee for other equipment.
- Cancellation during an actual model download returned the editor to its usable state with no partial output. The next run resumed from complete and partial local data and finished successfully.
- The first temporary browser context hit an actual OPFS quota near 2 GiB despite a larger reported estimate. A persistent profile downloaded and used the complete model beyond 5 GB. The app now has a specific resource-recovery message.
- A long single-file transfer slowed substantially. An actual 1 MiB Range probe completed in 893 ms; bounded 16 MiB transfers then completed the remaining weights. The implementation includes timeouts, byte-count checks, atomic completion and partial recovery.
- The old failed-profile cache was deleted through the UI. The successful persistent-profile test cache is also removed after validation, retaining only screenshots and exported ZIP evidence.

## Reproduction and evidence

Run the CLI flows in `docs/testing.md`. Ignored local artifacts include `output/playwright/mixed-eight.zip`, `offline-ios.zip`, `png-receipt.json`, `ai-real.zip`, desktop/mobile screenshots, AI output PNGs and an inspected landscape PNG. These files contain fictional test graphics, not user app data.

## Publication and compatibility limits

- No store listing was uploaded or approved. Store acceptance is not established by a dimension check.
- No real phone/Safari/Firefox inference test has been performed. Responsive desktop emulation does not establish physical-device GPU support.
- Replace the development `SITE_URL` placeholder with the actual public origin before publishing. No public domain was supplied or purchased.
- Legal pages use only the provided titular name and email. Provider-specific records and any additional operator identification need review for the chosen real deployment. No legal certification is claimed.
- Hosting quotas, remote model availability, download speed and browser cache persistence are outside the app's control. A pinned public model source and configurable mirror are provided.

## 20 October 2026 - AI memory and download recovery repair

The user reported that Chrome reset the whole editor after starting AI. That symptom is consistent with a browser tab discard under memory pressure, rather than a handled download error. The exact discard was not reproduced and its cause is not conclusively established on the user's Chrome profile.

Changes are confined to AI execution, model transfer recovery, AI diagnostics and related documentation/tests. The screenshot compositor, PNG encoder, ZIP exporter and template algorithm were not changed. The resident desktop engine is replaced by the existing streaming engine from the same pinned library/model revision, with sequential heavy phases and disposable ONNX workers. No model revision, dependency, external inference service or project persistence was introduced.

Verified in this run:

- TypeScript/Astro: zero errors, warnings and hints. Thirteen unit tests pass. Static production build passes.
- New cache regression tests reproduce and prevent stale truncated completion markers, incorrect initial ranges, confusion between segment and total size when HEAD hides length, and premature interruption of a progressing transfer lasting more than sixty seconds.
- Actual streaming inference in Chrome on an NVIDIA Ampere adapter completed on the first model download. Both platform outputs were labeled as local AI, and the original app name, image and caption remained in the editor.
- Downloaded `output/playwright/ai-streamed.zip`: Android 1080x1920 and iOS 1320x2868, RGB, eight bits per channel, PNG color type 2. Inspected the Android PNG visually: generated decorative background, complete red-bordered fixture and literal caption are present.
- Deliberately blocked model requests in a separate real browser session. The actual network failure produced expandable diagnostics, retained app name, screenshot and caption, and allowed explicit template recovery. This is an error-path simulation, not a GPU inference test.
- Template regression downloaded and independently decoded sixteen mixed-orientation Android/iOS PNGs plus seven iOS PNGs while offline. The existing fallback/cancellation/color-validation browser flow also passed.
- The general browser flow failed its final 390px horizontal-overflow assertion after the successful exports. No layout/CSS fix was made in this AI repair; do not describe the entire browser suite as passing.

Limits: streaming reduces memory pressure but does not prove survival on every RAM/GPU configuration. A browser-level crash or discard cannot preserve this deliberately nonpersistent editor session. The switch remains an opt-in; downloads begin only when Generate is pressed. The streamed files differ from old resident weights and can require an additional first download. No publication was performed.

Final-build cached inference also passed: two real AI outputs in 66.872 seconds on this setup, retained form, zero observed weight transfers and zero upload methods. Downloaded `ai-streamed-cached.zip` was independently decoded with the same exact dimensions, RGB channels, bit depth and color type. This timing is specific to the test machine. The final ONNX worker also detaches its downloaded buffer after ORT session creation to reduce duplicate RAM usage.

## 20 October 2026 - Independent phone selection

Added a second editor step with three Android frames (Galaxy S26, Pixel 8, Pixel 7) and four iOS frames (iPhone 12, 15, 17, 18 Pro). Each platform retains one independent choice. Original schematic drawing code uses researched manufacturer body proportions with illustrative camera, corner, rim and bezel details. See `device-frames.md` for official references, asset provenance and the standard iPhone 18 limitation.

Verification on the final implementation:

- `npm run check`: zero errors, warnings and hints. All thirteen unit tests pass. Production build passes.
- Real Chrome browser flow `tests/device-frames-flow.cjs` passes: all seven model choices, four downloaded ZIPs, sixteen PNGs covering both platforms and orientations, output invalidation after model changes, retained choices across AI/platform toggles, Spanish and English controls, and mobile picker bounds at 390px.
- `scripts/inspect-device-exports.mjs` independently decodes all sixteen downloaded PNGs: exact store dimensions, RGB with depth eight and PNG color type two. All four red-bordered fixture corners remain visible and aspect ratios are preserved. Three Android and four iOS output hashes are distinct; the repeated Galaxy S26 output is deterministic.
- Template requests observed during the browser flow stayed on the local origin and used no upload methods. AI was toggled but generation was not requested in AI mode.
- Visually inspected the downloaded horizontal iPhone frame and mobile selector. Evidence is under `output/playwright/devices-0.zip` through `devices-3.zip`, `device-receipt.json`, extracted model PNGs and `devices-mobile.png`.

Limits: the new frames are illustrations, not exact manufacturer mockups. The standard iPhone 18 is omitted pending a verifiable official design reference. Both AI and template modes call the same frame compositor, but this change did not rerun GPU inference. Earlier inference results above predate these frame changes. Mobile verification covers the new picker; the previously recorded whole-page overflow issue is not declared resolved by this change. No deployment was performed.


## 20 October 2026 - Frame appearance correction

The earlier schematic frames did not visually match the supplied mockup reference. Replaced the square inner screen and thick black header with a rounded display, thinner bezels, shaded metallic side rails, small buttons and camera hardware integrated into the glass. The picker now uses the same Canvas renderer as previews and final exports instead of a separate simplified SVG.

The complete source remains inside a mathematically bounded safe rectangle away from camera and rounded corners. Single-pixel source-edge colors fill only the surrounding display area; the original is never cropped, stretched, redrawn or covered. These are still original illustrative mockups, not exact licensed manufacturer product renders.

Final checks: Astro/TypeScript has zero errors, warnings and hints; thirteen unit tests pass; production build passes. The real Chrome device flow passes for seven models and downloads sixteen PNGs across both orientations/platforms. The independent decoder verifies exact dimensions, RGB depth eight/no alpha, distinct device renders and all four original fixture corners. The appearance flow also downloads a two-image ZIP with the fictional demo screen and captures the actual picker and Android/iPhone comparison. Visual inspection confirms rounded displays, thin rails and absence of the old black header. A clipped bottom-corner defect found during development was corrected before this final run.

Evidence: `output/playwright/device-appearance.zip`, `device-picker-desktop.png`, `mockup-preview.png`, `devices-0.zip` through `devices-3.zip`, and `device-receipt.json`. The comparison sheet crops only the exported composition around the device for visual inspection; it does not alter production exports. GPU inference was not rerun; both background modes continue to use the shared frame compositor. The old whole-page mobile overflow limitation is unchanged. No deployment was performed.

## 20 October 2026 - Dark theme and brand template redesign

The shared layout now starts in dark mode, restores `storeframe-theme` before paint and offers an accessible bilingual theme toggle on every page. Only this UI preference is persisted. Project images, captions and design settings remain session-only. Theme changes do not invalidate existing output or change exported pixels. Other tabs follow preference changes. Blocked storage is handled without breaking the current-visit switch. Both themes cover the landing page, editor controls, device picker, previews, results, information pages, footer and feedback states.

Local templates now use Primary throughout the background: solid for Clean, predominant with Secondary entering from the right side for Gradient, and a diagonal two-color field with fine rules for Editorial. Editorial has no automatic white footer. Swatches reflect the selected palette. Text ink is selected from white/black by sampling the actual background under the text, with a softly feathered Primary veil only when mixed colors prevent a sufficiently legible single ink. The veil is painted before the phone and cannot cover source pixels; it has no rectangular edge. The original phone renderer and screenshot fitting are unchanged. AI execution and its existing background tint/fade are unchanged.

Final validation:

- `npm run check`: zero errors, warnings and hints. `npm test`: fifteen passing tests, including arbitrary-brand ink contrast and exact blend endpoints. Production build passes for fourteen static pages.
- `tests/theme-templates-flow.cjs` passes in real Chrome: dark default despite light OS preference, saved Light/Dark after reload/navigation, Spanish/English information pages, cross-tab synchronization, storage-blocked behavior, mobile header fit at 375px and 390px, no page errors, retained outputs across theme changes, no uploads and no third-party template requests.
- Four actual downloaded ZIPs contain sixteen portrait/landscape Android/iOS PNGs. `scripts/inspect-template-exports.mjs` confirms exact dimensions, RGB depth eight/no alpha, solid Primary corners for Clean, both brand colors in Gradient/Editorial, no artificial white footer and all four source fixture corners. The repeated Editorial files are byte-identical across the website's dark and light themes.
- Visually reviewed dark home/settings and the three exported template designs. Evidence includes `theme-dark-home.png`, `theme-dark-settings.png`, `theme-light-settings.png`, `theme-dark-mobile.png`, `template-receipt.json`, four `template-*.zip` archives and `templates-preview.png` under `output/playwright/`.

Limits: no new GPU inference was run, no store submission or deployment was performed, and mobile header checks are not a claim that the earlier whole-page overflow issue is resolved. Contrast selection uses sampled compositor backgrounds; it is not an accessibility certification of arbitrary source screenshots. If local storage is disabled, the theme can be changed for that visit but cannot be remembered after reload. Storage preference details were added to the bilingual privacy pages.

## 20 October 2026 - Hero updated to real outputs

Replaced the hero's two legacy CSS phones with four actual editor exports: localized Spanish/English Galaxy S26 Gradient and iPhone 17 Editorial examples. The images were downloaded directly from individual result links and saved in `public/hero/`. Their complete exported composition is retained. Removed the unused hero-only CSS phone, external caption and app-name styling. Updated card sizes to preserve the different Android/iOS output aspect ratios.

`npm run check` reports zero errors, warnings and hints; all fifteen unit tests pass; the production build passes. Independently decoded all four public assets: Android 1080x1920, iOS 1320x2868, RGB, depth eight, no alpha. The real Chrome `tests/hero-flow.cjs` passes across Spanish/English, dark/light and 1440/1024/768/390/375px widths; both images load at native dimensions, use the correct locale and stay within viewport bounds. Visually inspected Spanish dark desktop and mobile captures. Evidence is under `output/playwright/hero-*.png`. Regeneration is reproducible through `tests/generate-hero-assets.cjs`. No AI inference or deployment was performed.

## 20 October 2026 - Creative AI backgrounds

The previous AI image was visually suppressed by a fixed seed, a minimal-paper/gradient prompt, luminance remapping to two colors, 34% opacity and a forced light caption fade. AI now has its own four creative directions and optional brief, with a fresh cryptographic seed for each generation. Template choices are hidden while AI is active and do not enter the art request. The real generated artwork is cover-fitted at full opacity with its colors intact. Adaptive text ink and a local feathered contrast veil are painted before the original phone and screenshot.

A first visual inspection found that image editing could duplicate the reference interface inside otherwise creative artwork. The final implementation gives the model an abstract palette moodboard extracted from 16x16 samples, rather than recognizable screen layouts. App name, captions and brief provide optional local text context. Another audit found the pinned engine's hard 128-token prompt context; the actual tokenizer now budgets instructions, keeping creative intent and no-interface constraints ahead of optional metadata. This does not increase model dimensions, denoising steps or resident memory. Model revision, engine/dependency versions, streaming execution, cache and licenses remain unchanged.

Verification completed:

- TypeScript/Astro reports zero errors, warnings and hints. Eighteen unit tests pass, including checks using the real pinned tokenizer, independence from template style, fresh seeds and bounded text. Production build passes.
- Real Chrome inference on a system reporting an NVIDIA Ampere adapter completed after the cold model download and on cached repeats. The final sculptural run used the abstract palette reference and an emerald/gold brief. Visually inspected the actual raw 512x512 artwork: folded material, botanical veins, layered depth, texture and directional light; no copied interface was observed in this sample. Inspected its real composed Android output as well.
- Downloaded `ai-creative.zip` contains Android 1080x1920 and iOS 1320x2868 RGB PNGs, depth eight, no alpha. `scripts/inspect-ai-art.mjs` independently compares background pixels outside text/device regions to the original model output: maximum differences were 0 and 1 channel values, consistent with scaling interpolation, not palette remapping or a faded overlay.
- The synthetic browser compositor check confirms that generated colors survive at full intensity and AI output is identical across Clean/Gradient/Editorial style values. This synthetic check is not inference evidence.
- Spanish/English creative-control and mobile-bound checks pass. Template selection is retained when switching back without AI. The deliberate model-network failure flow retains the form and supports explicit template recovery. The existing theme/template regression downloads and independently verifies sixteen PNGs.
- After the final real run, editing the creative brief removes all outputs and the original-art preview; fetching the old artwork object URL fails as expected, confirming revocation.

Evidence: `output/playwright/ai-creative-background.png`, `ai-creative-Android.png`, `ai-creative-iOS.png`, `ai-creative-results.png`, `ai-creative.zip`, `ai-creative-receipt.json` and localized `ai-controls-*.png`. The raw-art details panel uses its own revocable object URL. Test model weights remain in the ignored local browser profile for reuse.

Limits: these observations validate the inspected generation, not every possible prompt or all GPU hardware. The model sees palette inspiration rather than readable UI; semantic context comes from optional local text and may be shortened to fit 128 tokens. It can still produce unwanted content and should be reviewed. The sampled sculptural direction and the automatic direction without a custom brief were perceptually verified; geometric and organic presets have prompt/UI checks but no separate inspected inference in this run. No remote inference, account connection, paid service, store submission or deployment was introduced.


Default-mode acceptance also passed on the final code: automatic direction with an empty creative brief generated a visibly ornamental, embossed botanical pattern using the reference palette. Its raw image contains no recognizable interface in the inspected sample. Downloaded `ai-auto.zip` and the raw `ai-auto-background.png`; `node scripts/inspect-ai-art.mjs ai-auto` confirms both exact store dimensions, RGB/depth/no alpha and preservation of original generated colors. Additional evidence: `ai-auto-Android.png`, `ai-auto-iOS.png`, `ai-auto-results.png` and `ai-auto-receipt.json`. This verifies that choosing a manual art preset or writing a brief is not required to obtain patterned AI artwork.
