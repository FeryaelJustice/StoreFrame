import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PreTrainedTokenizer } from '@huggingface/transformers';
import { artPrompt, artRequest, AI_DIRECTIONS } from '../src/lib/ai-art';
import { DEFAULT_DESIGN } from '../src/lib/project';

const tokenizer = new PreTrainedTokenizer(
  JSON.parse(readFileSync('public/runtime/tokenizer/tokenizer.json', 'utf8')),
  { ...JSON.parse(readFileSync('public/runtime/tokenizer/tokenizer_config.json', 'utf8')), chat_template: readFileSync('public/runtime/tokenizer/chat_template.jinja', 'utf8') },
);
const chatOptions = { tokenize: false, add_generation_prompt: true, enable_thinking: false } as const;
const count = (prompt: string) => tokenizer(tokenizer.apply_chat_template([{ role: 'user', content: prompt }], chatOptions) as string, { padding: false, truncation: false }).input_ids.data.length;

describe('Local AI art direction', () => {
  it('keeps creative intent, palette and no-interface instructions inside the actual 128-token budget', () => {
    for (const direction of AI_DIRECTIONS) {
      const request = artRequest({ ...DEFAULT_DESIGN, aiDirection: direction, primary: '#244d42', secondary: '#d9c38b', aiBrief: 'Folded paper ribbons and botanical leaf veins. '.repeat(8), appName: 'Wellness' }, Array.from({ length: 8 }, () => ({ caption: 'A screen about calm and daily habits. '.repeat(12) })), 12);
      const prompt = artPrompt(request, count);
      expect(count(prompt)).toBeLessThanOrEqual(128);
      expect(prompt).toContain('no phones, UI, text');
      expect(prompt).toContain('green');
      expect(prompt).toContain('Idea:');
    }
  });
  it('does not depend on the template style or force default brand colors into generated art', () => {
    const prompts = ['clean', 'gradient', 'editorial'].map(style => artPrompt(artRequest({ ...DEFAULT_DESIGN, style: style as typeof DEFAULT_DESIGN.style }, [], 1), count));
    expect(new Set(prompts).size).toBe(1);
    expect(prompts[0]).not.toContain('Dominant');
  });
  it('creates a fresh seed per generation and bounds optional text without mutating the original', () => {
    const seeds = Array.from({ length: 4 }, () => artRequest(DEFAULT_DESIGN, []).seed);
    expect(new Set(seeds).size).toBeGreaterThan(1);
    const text = 'a'.repeat(500); const request = artRequest({ ...DEFAULT_DESIGN, aiBrief: text }, [{ caption: text }], 23);
    expect(request.seed).toBe(23); expect(request.brief).toHaveLength(280); expect(request.captions[0]).toHaveLength(120); expect(text).toHaveLength(500);
  });
});
