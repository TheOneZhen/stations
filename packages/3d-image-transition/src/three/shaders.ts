import type { AnimationPhase } from '../types';

const CUBIC_BEZIER = `
vec3 cubicBezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float t2 = t * t;
  float t3 = t2 * t;
  float mt = 1.0 - t;
  float mt2 = mt * mt;
  float mt3 = mt2 * mt;
  return mt3 * p0 + 3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3 * p3;
}
`;

const EASE_IN_OUT_CUBIC = `
float easeInOutCubic(float t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}
`;

/** Vertex shader: scale face from centroid, then offset along a cubic-Bezier path. */
export function createSlideVertexShader(phase: AnimationPhase): string {
  const scaleExpr = phase === 'in' ? 'tProgress' : '1.0 - tProgress';

  return `
${CUBIC_BEZIER}
${EASE_IN_OUT_CUBIC}

uniform float uTime;

attribute vec2 aAnimation;
attribute vec3 aStartPosition;
attribute vec3 aControl0;
attribute vec3 aControl1;
attribute vec3 aEndPosition;

varying vec2 vUv;

void main() {
  vUv = uv;

  float tDelay = aAnimation.x;
  float tDuration = aAnimation.y;
  float tTime = clamp(uTime - tDelay, 0.0, tDuration);
  float tProgress = easeInOutCubic(tTime / tDuration);

  vec3 transformed = position;
  transformed *= ${scaleExpr};
  transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;
}

export const SLIDE_FRAGMENT_SHADER = `
uniform sampler2D map;

varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(map, vUv);
}
`;
