import { describe, it, expect } from 'vitest';
import { encode, decode } from 'fast-png';
import { unzipSync } from 'fflate';
import { slug, filename, dimensions, move, contain, rgbaToRgb, validColor, type Output } from '../src/lib/project';
import { makeZip } from '../src/lib/export';
describe('Store export contract', () => {
  it('normalizes app names and never creates paths', () => {
    expect(slug('Mí App / ../../ Pró!')).toBe('mi-app-pro');
    expect(slug('こんにちは')).toBe('app'); expect(slug('')).toBe('app');
    expect(filename('Mí App', 0)).toBe('mi-app_01.png'); expect(filename('', 7)).toBe('app_08.png');
  });
  it('exports the exact store sizes in either orientation', () => {
    expect(dimensions('Android', false)).toEqual([1080, 1920]); expect(dimensions('Android', true)).toEqual([1920, 1080]);
    expect(dimensions('iOS', false)).toEqual([1320, 2868]); expect(dimensions('iOS', true)).toEqual([2868, 1320]);
  });
  it('moves the entire screenshot record with its caption', () => {
    const original = [{ id: 'a', caption: 'First' }, { id: 'b', caption: 'Second' }, { id: 'c', caption: '' }];
    expect(move(original, 0, 2).map(s => s.caption)).toEqual(['Second', '', 'First']); expect(original[0].id).toBe('a');
    expect(move(original, -1, 2)).toBe(original);
  });
  it('contains unusual source sizes without cropping or distortion', () => {
    for (const [w, h] of [[1000, 2000], [2000, 1000], [300, 300], [100, 4000]]) {
      const fit = contain(w, h, 20, 30, 400, 500);
      expect(fit.w / fit.h).toBeCloseTo(w / h); expect(fit.x).toBeGreaterThanOrEqual(20); expect(fit.y).toBeGreaterThanOrEqual(30);
      expect(fit.x + fit.w).toBeLessThanOrEqual(420); expect(fit.y + fit.h).toBeLessThanOrEqual(530);
    }
  });
  it('encodes a genuine 24-bit RGB PNG without alpha, including transparent input', () => {
    const rgb = rgbaToRgb(new Uint8Array([255, 0, 0, 255, 0, 0, 0, 0]));
    expect([...rgb]).toEqual([255, 0, 0, 255, 255, 255]);
    const png = encode({ width: 2, height: 1, channels: 3, depth: 8, data: rgb });
    expect(png[24]).toBe(8); expect(png[25]).toBe(2); expect(decode(png).channels).toBe(3);
  });
  it('packs only selected platform folders in editor order for a complete 8-image batch', () => {
    for (const platforms of [['Android'], ['iOS'], ['Android', 'iOS']]) {
      const outputs = platforms.flatMap(platform => Array.from({ length: 8 }, (_, index) => ({ platform, name: filename('My App', index), png: new Uint8Array([index]) }))) as Output[];
      const files = unzipSync(makeZip(outputs)); expect(Object.keys(files)).toHaveLength(platforms.length * 8);
      expect(Object.keys(files)[0]).toBe(`${platforms[0]}/my-app_01.png`);
      for (const platform of platforms) expect([...files[`${platform}/my-app_08.png`]]).toEqual([7]);
    }
  });
  it('accepts empty colors and exact hexadecimal colors only', () => { expect(validColor('')).toBe(true); expect(validColor('#Ab125F')).toBe(true); expect(validColor('red')).toBe(false); });
});
