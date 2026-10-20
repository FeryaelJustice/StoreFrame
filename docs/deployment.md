# Deployment

No deployment has been performed by implementing this project. These instructions prepare a manual deployment.

## Build

Set `SITE_URL` to the final HTTPS origin in `.env` or the hosting build environment. For example, `SITE_URL=https://your-project.pages.dev`. This value must match the real deployment. `PUBLIC_MODEL_BASE_URL` is optional and contains only a public URL, never credentials.

```sh
npm ci
npm run check
npm test
npm run build
```

Publish the contents of `dist/`. No Node process is required for production. The `serve` command is a local production preview, not a public server.

## Cloudflare Pages

- Choose a static project, build command `npm run build`, output directory `dist`.
- Use Node.js 24 or a compatible supported version.
- Add `SITE_URL` before the final build.
- The generated `dist/_headers` contains the COOP/COEP headers for WASM threads.
- Weights remain on the configured public model host and do not count as Pages assets.
- All shipped files are checked against the 25 MiB per-asset limit. No Functions, R2 bucket, paid inference, subscription or custom-domain purchase is required by this architecture.

Consult the provider's current free-tier terms and limits before publishing: https://developers.cloudflare.com/pages/platform/limits/

## Generic hosting, VPS, Apache or nginx

Serve `dist/` over HTTPS with directory index support. Preserve the files under `runtime/` and `licenses/`. Serve `.wasm` as `application/wasm`, `.js` and `.mjs` as JavaScript, and HTML/CSS/SVG/PNG with their appropriate content types.

Set these response headers on HTML and local resources:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

COOP/COEP are needed for multiple WASM threads. Without cross-origin isolation, ORT is configured to a single thread. HTTPS or localhost is needed for WebGPU and OPFS. Do not redirect asset URLs to the homepage: missing workers must return a real error.

## Model mirror

For an nginx deployment, upload each build to a versioned directory and point the document root at the active release. A minimal server block, after obtaining a valid TLS certificate, is:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.example;
    root /srv/storeframe/current;
    index index.html;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    include mime.types;

    add_header Cross-Origin-Opener-Policy same-origin always;
    add_header Cross-Origin-Embedder-Policy require-corp always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Replace the domain, document root and certificate paths with the operator's values. Configure HTTP to redirect to HTTPS. Ensure the server MIME map includes `.wasm` as `application/wasm` and `.mjs` as JavaScript. The `_headers` file is interpreted by compatible static hosts; nginx and Apache require their own configuration. Do not apply an SPA fallback to this multipage site.

Use short or revalidation-based caching for HTML and stable `runtime/` URLs. Only content-hashed assets such as `/_astro/` are suitable for long immutable caching. Preserve a complete previous artifact for rollback, switch releases together, and test both languages, worker loading, isolation and downloaded exports at the real HTTPS origin. Deployments should build from a clean checkout with `npm ci`, run the checks above, and transfer only `dist/`. Never publish `.env`, development profiles or the repository working directory as a web root.

## Model mirror configuration

The source revision is `e8f306c29bae4ea18a4d81a3d79507d91e05e94f` of `radames/flux2-klein-edge-web`. Obtain it while available and retain the original directory tree, filenames, manifest contents and license/provenance information.

Serve the mirror over HTTPS. Allow CORS from the app's origin, support `Range` with HTTP 206, expose `ETag`, `Content-Length`, `Content-Range` and `Accept-Ranges` where relevant, and do not require client-side secrets. Keep remote resources compatible with the app's COEP policy. Set `PUBLIC_MODEL_BASE_URL` to the mirror root and rebuild. Test a cold download, a cache hit and a resumed download.

The model repository is several GB. Serving your own copy uses storage and bandwidth and may exceed free hosting limits. A public download host can impose quotas or become unavailable. Downloaded cached weights can work offline while the app resources remain loaded, but cache persistence is controlled by the browser. No perpetual availability is promised.

Private browsing and temporary automated contexts can impose a much smaller real OPFS quota than `navigator.storage.estimate()` reports. Test AI with a regular or persistent browser profile. An actual quota error must be treated as a resource limit; the editor explains how to recover or choose local templates.

## Release preparation

Check the actual origin in canonical URLs, sitemap, robots and social metadata. Replace the social image if necessary for the target platform. Verify the published headers, MIME types and a complete export in both languages. Confirm the contact information and provider-specific privacy description. The operator has supplied a name and contact email; no address, tax identifier or additional personal data should be invented. No claim of legal certification is made.

Roll back by serving the previous `dist` artifact. Keep the dependency lockfile, pinned model revision and release validation receipt with each artifact.
