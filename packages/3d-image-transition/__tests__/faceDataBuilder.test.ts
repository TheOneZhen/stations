import { describe, expect, it } from 'vitest';
import {
  buildSlideFaces,
  getExpectedFaceCount,
} from '../src/core/faceDataBuilder';
import { createSeededRandomSource } from '../src/core/randomSource';

describe('faceDataBuilder', () => {
  const config = {
    width: 100,
    height: 60,
    widthSegments: 200,
    heightSegments: 120,
    phase: 'in' as const,
  };

  it('builds the expected number of triangle faces', () => {
    const { faces } = buildSlideFaces(config, createSeededRandomSource(1));
    expect(faces.length).toBe(getExpectedFaceCount(200, 120));
    expect(faces.length).toBe(200 * 120 * 2);
  });

  it('creates consistent per-vertex animation data', () => {
    const { faces } = buildSlideFaces(
      {
        width: 10,
        height: 6,
        widthSegments: 4,
        heightSegments: 2,
        phase: 'out',
      },
      createSeededRandomSource(99),
    );

    faces.forEach((face) => {
      expect(face.localVertices).toHaveLength(3);
      expect(face.uvs).toHaveLength(3);
      expect(face.duration).toBeGreaterThan(0);
      expect(face.start).toEqual(face.centroid);
      expect(face.end).toEqual(face.centroid);
    });
  });
});
