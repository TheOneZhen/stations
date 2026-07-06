import { describe, expect, it } from 'vitest';
import { createSlideGeometry } from '../src/three/createSlideGeometry';
import type { FaceAnimationData } from '../src/types';

const sampleFace: FaceAnimationData = {
  centroid: { x: 0, y: 0, z: 0 },
  delay: 0.5,
  duration: 1,
  start: { x: 0, y: 0, z: 0 },
  control0: { x: 1, y: 2, z: 3 },
  control1: { x: 4, y: 5, z: 6 },
  end: { x: 0, y: 0, z: 0 },
  localVertices: [
    { x: -1, y: -1, z: 0 },
    { x: 1, y: -1, z: 0 },
    { x: 0, y: 1, z: 0 },
  ],
  uvs: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0.5, y: 1 },
  ],
};

describe('createSlideGeometry', () => {
  it('packs each face as three non-indexed vertices', () => {
    const geometry = createSlideGeometry([sampleFace, sampleFace]);

    expect(geometry.getAttribute('position').count).toBe(6);
    expect(geometry.getAttribute('uv').count).toBe(6);
    expect(geometry.getAttribute('aAnimation').count).toBe(6);
    expect(geometry.getAttribute('aStartPosition').count).toBe(6);
  });

  it('copies face attributes into buffer arrays', () => {
    const geometry = createSlideGeometry([sampleFace]);
    const positions = geometry.getAttribute('position').array as Float32Array;
    const uvs = geometry.getAttribute('uv').array as Float32Array;
    const animation = geometry.getAttribute('aAnimation').array as Float32Array;

    expect(Array.from(positions.slice(0, 3))).toEqual([-1, -1, 0]);
    expect(Array.from(uvs)).toEqual([0, 0, 1, 0, 0.5, 1]);
    expect(Array.from(animation.slice(0, 2))).toEqual([0.5, 1]);
  });
});
