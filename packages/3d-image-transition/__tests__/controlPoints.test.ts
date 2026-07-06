import { describe, expect, it } from 'vitest';
import {
  computeBezierControls,
  getControlPoint0,
  getControlPoint1,
} from '../src/core/controlPoints';
import { createSeededRandomSource } from '../src/core/randomSource';

describe('controlPoints', () => {
  const random = createSeededRandomSource(7);

  it('flips Y sign based on centroid', () => {
    const top = getControlPoint0({ x: 0, y: 10, z: 0 }, random);
    const bottom = getControlPoint0({ x: 0, y: -10, z: 0 }, createSeededRandomSource(7));

    expect(Math.sign(top.y)).toBe(1);
    expect(Math.sign(bottom.y)).toBe(-1);
  });

  it('keeps control point ranges within expected bounds', () => {
    const cp0 = getControlPoint0({ x: 0, y: 5, z: 0 }, random);
    const cp1 = getControlPoint1({ x: 0, y: 5, z: 0 }, createSeededRandomSource(7));

    expect(cp0.x).toBeGreaterThanOrEqual(5);
    expect(cp0.x).toBeLessThanOrEqual(15);
    expect(cp1.x).toBeGreaterThanOrEqual(15);
    expect(cp1.x).toBeLessThanOrEqual(30);
    expect(Math.abs(cp0.z)).toBeLessThanOrEqual(10);
    expect(Math.abs(cp1.z)).toBeLessThanOrEqual(10);
  });

  it('subtracts controls for in phase and adds for out phase', () => {
    const centroid = { x: 1, y: 2, z: 3 };
    const inControls = computeBezierControls(centroid, 'in', random);
    const outControls = computeBezierControls(
      centroid,
      'out',
      createSeededRandomSource(7),
    );

    expect(inControls.start).toEqual(centroid);
    expect(inControls.end).toEqual(centroid);
    expect(inControls.control0.x).toBeLessThan(centroid.x);
    expect(outControls.control0.x).toBeGreaterThan(centroid.x);
  });
});
