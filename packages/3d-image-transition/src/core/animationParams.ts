import {
  MAX_DELAY_X,
  MAX_DELAY_Y,
  MAX_DURATION,
  MIN_DURATION,
  STRETCH,
} from './constants';
import type { AnimationPhase, RandomSource, Vec3 } from '../types';

export function mapLinear(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeTotalDuration(): number {
  return MAX_DURATION + MAX_DELAY_X + MAX_DELAY_Y + STRETCH;
}

export interface FaceAnimationParams {
  delay: number;
  duration: number;
}

export function computeFaceAnimationParams(
  centroid: Vec3,
  width: number,
  height: number,
  phase: AnimationPhase,
  random: RandomSource,
): FaceAnimationParams {
  const duration = random.randFloat(MIN_DURATION, MAX_DURATION);
  const delayX = mapLinear(centroid.x, -width * 0.5, width * 0.5, 0, MAX_DELAY_X);

  const delayY =
    phase === 'in'
      ? mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0, MAX_DELAY_Y)
      : mapLinear(Math.abs(centroid.y), 0, height * 0.5, MAX_DELAY_Y, 0);

  const delay = delayX + delayY + random.random() * STRETCH * duration;

  return { delay, duration };
}
