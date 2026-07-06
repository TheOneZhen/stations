import { describe, expect, it } from 'vitest';
import {
  clamp,
  computeFaceAnimationParams,
  computeTotalDuration,
  mapLinear,
} from '../src/core/animationParams';
import {
  MAX_DELAY_X,
  MAX_DELAY_Y,
  MAX_DURATION,
  MIN_DURATION,
} from '../src/core/constants';
import { createSeededRandomSource } from '../src/core/randomSource';

describe('animationParams', () => {
  const random = createSeededRandomSource(42);

  it('maps delayX linearly across slide width', () => {
    const left = computeFaceAnimationParams(
      { x: -50, y: 0, z: 0 },
      100,
      60,
      'in',
      random,
    );
    const right = computeFaceAnimationParams(
      { x: 50, y: 0, z: 0 },
      100,
      60,
      'in',
      createSeededRandomSource(42),
    );

    expect(left.duration).toBeGreaterThanOrEqual(MIN_DURATION);
    expect(left.duration).toBeLessThanOrEqual(MAX_DURATION);
    expect(right.delay).toBeGreaterThan(left.delay);
  });

  it('uses opposite delayY direction for in vs out', () => {
    const centroid = { x: 0, y: 30, z: 0 };
    const inParams = computeFaceAnimationParams(centroid, 100, 60, 'in', random);
    const outParams = computeFaceAnimationParams(
      centroid,
      100,
      60,
      'out',
      createSeededRandomSource(42),
    );

    const expectedInY = mapLinear(Math.abs(centroid.y), 0, 30, 0, MAX_DELAY_Y);
    const expectedOutY = mapLinear(Math.abs(centroid.y), 0, 30, MAX_DELAY_Y, 0);

    expect(inParams.delay).toBeGreaterThanOrEqual(expectedInY);
    expect(outParams.delay).toBeGreaterThanOrEqual(expectedOutY);
  });

  it('computes totalDuration upper bound', () => {
    expect(computeTotalDuration()).toBe(MAX_DURATION + MAX_DELAY_X + MAX_DELAY_Y + 0.11);
  });

  it('clamps values', () => {
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
