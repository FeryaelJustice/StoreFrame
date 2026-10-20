import { describe, expect, it } from 'vitest';
import { contrast, inkFor, mix } from '../src/lib/template-design';

describe('Brand template color contrast', () => {
  it('chooses legible ink across arbitrary brand colors, including middle gray', () => {
    for (const hex of ['#ffffff', '#000000', '#777777', '#1234ab', '#f0cb42', '#ff0000', '#ff00ff', '#244d42']) {
      expect(contrast(inkFor(hex), hex)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('keeps exact endpoints when blending brand fields', () => {
    expect(mix('#1234ab', '#f0cb42', 0)).toBe('#1234ab');
    expect(mix('#1234ab', '#f0cb42', 1)).toBe('#f0cb42');
    expect(mix('#000000', '#ffffff', .5)).toBe('#808080');
  });
});
