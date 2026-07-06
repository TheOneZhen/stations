import { describe, expect, it } from 'vitest';
import { createMathRandomSource, createSeededRandomSource } from '../src/core/randomSource';

describe('randomSource', () => {
  it('produces deterministic values from a seeded source', () => {
    const a = createSeededRandomSource(123);
    const b = createSeededRandomSource(123);

    const samplesA = [a.random(), a.randFloat(0, 10), a.randFloatSpread(4)];
    const samplesB = [b.random(), b.randFloat(0, 10), b.randFloatSpread(4)];

    expect(samplesA).toEqual(samplesB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createSeededRandomSource(1);
    const b = createSeededRandomSource(2);

    expect(a.random()).not.toBe(b.random());
  });

  it('keeps randFloat within the requested bounds', () => {
    const random = createSeededRandomSource(99);

    for (let i = 0; i < 20; i++) {
      const value = random.randFloat(2, 5);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it('returns a working math random source', () => {
    const random = createMathRandomSource();
    expect(random.random()).toBeGreaterThanOrEqual(0);
    expect(random.random()).toBeLessThan(1);
  });
});
