# Device frames

The editor selects one phone for each enabled platform. The choice applies to the complete batch in both local-template and AI-background modes. Selecting a device switches the live preview to that platform. Choices survive platform toggles within the session. Every change invalidates existing exports.

`src/lib/devices.ts` holds the catalog. `src/lib/phone.ts` draws original Canvas mockups with model-specific body proportions, rounded display outlines, thin bezels, camera details, shaded metallic rims and side buttons. This renderer is shared by picker thumbnails, previews and final exports. These are illustrative frontal frames, not exact product renders or manufacturer-approved engineering templates. Similar generations can look similar from the front. Radii, cameras and bezels are artistic approximations.

Portrait body proportions use the manufacturer's width and height. Landscape rotates the body and camera together while keeping the screenshot upright. The entire screenshot is contained within a rectangular safe area below the camera and away from rounded corners. Sampled source-edge colors fill the small surrounding bands, so the display reaches the rounded glass boundary without a thick black header or square screen opening. The camera sits inside this glass area. No source pixels are clipped or covered by the camera. The source itself is never stretched; only single-pixel edge colors are extended outside it. Store export dimensions, platform directories and filenames remain independent of the selected phone.

## References reviewed on 20 October 2026

- Samsung Galaxy S26, 71.7 x 149.6 mm: [official launch specifications](https://news.samsung.com/global/samsung-unveils-galaxy-s26-series-the-most-intuitive-galaxy-ai-phone-yet) and [design reference](https://design.samsung.com/global/contents/view/galaxy-s26).
- Google Pixel 8, 70.8 x 150.5 mm; Pixel 7, 73.2 x 155.6 mm: [Google hardware specifications](https://support.google.com/pixelphone/answer/7158570?hl=en).
- iPhone 12, 71.5 x 146.7 mm: [Apple specifications](https://support.apple.com/en-us/111876).
- iPhone 15, 71.6 x 147.6 mm: [Apple specifications](https://support.apple.com/en-us/111831).
- iPhone 17, 71.5 x 149.6 mm: [Apple specifications](https://www.apple.com/iphone-17/specs/).
- iPhone 18 Pro, 71.9 x 150.0 mm, Dynamic Island: [Apple specifications](https://www.apple.com/iphone-18-pro/specs/).

No verifiable official design reference was found for the standard iPhone 18 in this review. It is not offered as a fabricated device. The bilingual editor explains this limitation. Add it only after verifying a manufacturer reference.

## Asset provenance

No external SVG, CSS mockup, product photograph, logo or frame pack was copied or downloaded. All frame drawing code and picker illustrations were authored for this project. Reference links provide design/specification context, not asset licenses. Public source code is not automatically free of copyright. Product names and industrial designs can have separate protections; these illustrations do not imply endorsement or legal clearance. Existing project ownership and third-party notices remain applicable.
