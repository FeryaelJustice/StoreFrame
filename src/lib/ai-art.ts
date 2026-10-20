import { validColor, type AiDirection, type Design, type Shot } from './project';

export const AI_DIRECTIONS: AiDirection[] = ['auto', 'sculptural', 'geometric', 'organic'];
export interface ArtRequest {
  direction: AiDirection; brief: string; appName: string; captions: string[];
  primary: string; secondary: string; seed: number;
}
export function artRequest(design: Design, shots: Pick<Shot, 'caption'>[], seed = crypto.getRandomValues(new Uint32Array(1))[0]): ArtRequest {
  return {
    direction: AI_DIRECTIONS.includes(design.aiDirection) ? design.aiDirection : 'auto',
    brief: design.aiBrief.trim().slice(0, 280), appName: design.appName.slice(0, 80),
    captions: shots.map(s => s.caption.trim().slice(0, 120)).filter(Boolean).slice(0, 8),
    primary: validColor(design.primary) ? design.primary : '', secondary: validColor(design.secondary) ? design.secondary : '', seed,
  };
}
function colorWords(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  if (delta < .08) return max < .25 ? 'charcoal black' : min > .8 ? 'soft white' : 'neutral gray';
  let hue = (max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
  if (hue < 0) hue += 360;
  const name = hue < 20 || hue >= 345 ? 'red' : hue < 50 ? 'orange or warm gold' : hue < 75 ? 'yellow or gold' : hue < 165 ? 'green' : hue < 200 ? 'teal or cyan' : hue < 260 ? 'blue' : hue < 300 ? 'violet' : 'magenta';
  return `${max < .5 ? 'deep dark' : min > .5 ? 'light pastel' : 'rich'} ${name}`;
}
export function artPrompt(request: ArtRequest, tokenCount?: (prompt: string) => number): string {
  const directions: Record<AiDirection, string> = {
    auto: 'thematic sculptural artwork with imaginative repeated motifs',
    sculptural: 'sculptural folded ribbons with tactile ridges and flowing layers',
    geometric: 'tessellated relief tiles and interlocking faceted three-dimensional shapes',
    organic: 'layered organic petals, branching contours and botanical vein patterns',
  };
  // The pinned engine has a 128-token context, including the chat wrapper.
  // Keep the visual brief and exclusion of interfaces BEFORE optional metadata.
  const core = `Create original ${directions[request.direction]}. Background only: no phones, UI, text, logos or blank panels. Use reference colors, never its layout. Layered patterns, tactile texture, depth and shadows across the frame, not a plain gradient.`;
  const palette = [request.primary && `Dominant ${colorWords(request.primary)}.`, request.secondary && `Accents ${colorWords(request.secondary)}.`].filter(Boolean).join(' ');
  let prompt = core;
  const append = (label: string, value: string) => {
    const characters = Array.from(value.trim());
    if (!characters.length) return;
    const candidate = (length: number) => `${prompt} ${label}${characters.slice(0, length).join('')}`;
    if (!tokenCount || tokenCount(candidate(characters.length)) <= 128) { prompt = candidate(characters.length); return; }
    let low = 0, high = characters.length;
    while (low < high) { const mid = Math.ceil((low + high) / 2); if (tokenCount(candidate(mid)) <= 128) low = mid; else high = mid - 1; }
    const part = characters.slice(0, low).join('').replace(/\s+\S*$/, '').trim();
    if (part) prompt += ` ${label}${part}`;
  };
  append('', palette);
  append('Idea: ', request.brief);
  append('Theme: ', [request.appName, ...request.captions].filter(Boolean).join('; ').slice(0, 160));
  return prompt;
}
