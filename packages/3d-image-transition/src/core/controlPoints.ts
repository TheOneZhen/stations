import type { RandomSource, Vec3 } from '../types';

export function getControlPoint0(centroid: Vec3, random: RandomSource): Vec3 {
  const signY = Math.sign(centroid.y) || 1;

  return {
    x: random.randFloat(0.1, 0.3) * 50,
    y: signY * random.randFloat(0.1, 0.3) * 70,
    z: random.randFloatSpread(20),
  };
}

export function getControlPoint1(centroid: Vec3, random: RandomSource): Vec3 {
  const signY = Math.sign(centroid.y) || 1;

  return {
    x: random.randFloat(0.3, 0.6) * 50,
    y: -signY * random.randFloat(0.3, 0.6) * 70,
    z: random.randFloatSpread(20),
  };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function computeBezierControls(
  centroid: Vec3,
  phase: 'in' | 'out',
  random: RandomSource,
): { start: Vec3; control0: Vec3; control1: Vec3; end: Vec3 } {
  const start = { ...centroid };
  const end = { ...centroid };
  const cp0 = getControlPoint0(centroid, random);
  const cp1 = getControlPoint1(centroid, random);

  if (phase === 'in') {
    return {
      start,
      end,
      control0: subVec3(centroid, cp0),
      control1: subVec3(centroid, cp1),
    };
  }

  return {
    start,
    end,
    control0: addVec3(centroid, cp0),
    control1: addVec3(centroid, cp1),
  };
}
