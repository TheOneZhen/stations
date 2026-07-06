import { describe, expect, it } from 'vitest';
import {
  buildSlideFaces,
  getExpectedFaceCount,
} from '../src/core/faceDataBuilder';
import { computeTotalDuration } from '../src/core/animationParams';
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

  it('aligns uv.y with PlaneGeometry (0 at bottom, 1 at top)', () => {
    const { faces } = buildSlideFaces(
      {
        width: 10,
        height: 10,
        widthSegments: 1,
        heightSegments: 1,
        phase: 'in',
      },
      createSeededRandomSource(1),
    );

    const averageUvY = (face: (typeof faces)[number]) =>
      face.uvs.reduce((sum, uv) => sum + uv.y, 0) / face.uvs.length;

    const bottomFace = faces.find((face) => face.centroid.y < 0)!;
    const topFace = faces.find((face) => face.centroid.y > 0)!;

    expect(averageUvY(bottomFace)).toBeLessThan(averageUvY(topFace));
  });

  it('stores vertices in local centroid space', () => {
    const { faces } = buildSlideFaces(
      {
        width: 10,
        height: 6,
        widthSegments: 2,
        heightSegments: 2,
        phase: 'in',
      },
      createSeededRandomSource(5),
    );

    faces.forEach((face) => {
      const avgLocal = face.localVertices.reduce(
        (acc, vertex) => ({
          x: acc.x + vertex.x,
          y: acc.y + vertex.y,
          z: acc.z + vertex.z,
        }),
        { x: 0, y: 0, z: 0 },
      );

      expect(avgLocal.x / 3).toBeCloseTo(0);
      expect(avgLocal.y / 3).toBeCloseTo(0);
      expect(avgLocal.z / 3).toBeCloseTo(0);
    });
  });

  it('returns shared totalDuration from computeTotalDuration', () => {
    const { totalDuration } = buildSlideFaces(config, createSeededRandomSource(1));
    expect(totalDuration).toBe(computeTotalDuration());
  });
});
