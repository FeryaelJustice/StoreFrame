export const MODEL_REVISION = 'e8f306c29bae4ea18a4d81a3d79507d91e05e94f';
export const MODEL_BASE = import.meta.env.PUBLIC_MODEL_BASE_URL || `https://huggingface.co/radames/flux2-klein-edge-web/resolve/${MODEL_REVISION}`;
export const CACHE_DIR = `storeframe-flux-${MODEL_REVISION.slice(0, 8)}`;
