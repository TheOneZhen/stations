import { computeFaceAnimationParams, computeTotalDuration } from './animationParams';
import { computeBezierControls } from './controlPoints';
import { createMathRandomSource } from './randomSource';
import type {
  FaceAnimationData,
  RandomSource,
  SlideBuildResult,
  SlideGridConfig,
  Vec2,
  Vec3,
} from '../types';

function computeCentroid(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  return {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
    z: (a.z + b.z + c.z) / 3,
  };
}

/** Expresses a world-space vertex relative to its face centroid (for GPU scaling). */
function toLocal(vertex: Vec3, centroid: Vec3): Vec3 {
  return {
    x: vertex.x - centroid.x,
    y: vertex.y - centroid.y,
    z: vertex.z - centroid.z,
  };
}

/**
 * Subdivides the slide plane into a grid. UVs match Three.js PlaneGeometry
 * (v=0 at bottom, v=1 at top) so textures with flipY=true render upright.
 */
function buildGridVertices(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
): { positions: Vec3[]; uvs: Vec2[] } {
  const positions: Vec3[] = [];
  const uvs: Vec2[] = [];
  const halfW = width * 0.5;
  const halfH = height * 0.5;

  for (let y = 0; y <= heightSegments; y++) {
    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const v = y / heightSegments;
      positions.push({
        x: u * width - halfW,
        y: v * height - halfH,
        z: 0,
      });
      uvs.push({ x: u, y: v });
    }
  }

  return { positions, uvs };
}

function getVertexIndex(x: number, y: number, widthSegments: number): number {
  return y * (widthSegments + 1) + x;
}

/**
 * Tessellates the slide plane into animated triangle faces. Each quad is split
 * into two triangles; every face carries its own delay, Bezier path, and UVs.
 */
export function buildSlideFaces(
  config: SlideGridConfig,
  random: RandomSource = createMathRandomSource(),
): SlideBuildResult {
  const { width, height, widthSegments, heightSegments, phase } = config;
  const { positions, uvs } = buildGridVertices(
    width,
    height,
    widthSegments,
    heightSegments,
  );
  const faces: FaceAnimationData[] = [];

  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const i0 = getVertexIndex(x, y, widthSegments);
      const i1 = getVertexIndex(x + 1, y, widthSegments);
      const i2 = getVertexIndex(x + 1, y + 1, widthSegments);
      const i3 = getVertexIndex(x, y + 1, widthSegments);

      const triangles: [number, number, number][] = [
        [i0, i1, i2],
        [i0, i2, i3],
      ];

      for (const [a, b, c] of triangles) {
        const va = positions[a];
        const vb = positions[b];
        const vc = positions[c];
        const centroid = computeCentroid(va, vb, vc);
        const { delay, duration } = computeFaceAnimationParams(
          centroid,
          width,
          height,
          phase,
          random,
        );
        const bezier = computeBezierControls(centroid, phase, random);

        faces.push({
          centroid,
          delay,
          duration,
          start: bezier.start,
          control0: bezier.control0,
          control1: bezier.control1,
          end: bezier.end,
          localVertices: [toLocal(va, centroid), toLocal(vb, centroid), toLocal(vc, centroid)],
          uvs: [uvs[a], uvs[b], uvs[c]],
        });
      }
    }
  }

  return {
    faces,
    totalDuration: computeTotalDuration(),
  };
}

export function getExpectedFaceCount(
  widthSegments: number,
  heightSegments: number,
): number {
  return widthSegments * heightSegments * 2;
}
