export type AnimationPhase = 'in' | 'out';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface FaceAnimationData {
  centroid: Vec3;
  delay: number;
  duration: number;
  start: Vec3;
  control0: Vec3;
  control1: Vec3;
  end: Vec3;
  localVertices: [Vec3, Vec3, Vec3];
  uvs: [Vec2, Vec2, Vec2];
}

export interface SlideGridConfig {
  width: number;
  height: number;
  widthSegments: number;
  heightSegments: number;
  phase: AnimationPhase;
}

export interface SlideBuildResult {
  faces: FaceAnimationData[];
  totalDuration: number;
}

export interface RandomSource {
  random: () => number;
  randFloat: (min: number, max: number) => number;
  randFloatSpread: (range: number) => number;
}

export interface SceneControllerOptions {
  width: number;
  height: number;
  imageUrl: string;
  autoplay?: boolean;
  enableScrub?: boolean;
  fov?: number;
  antialias?: boolean;
}

export interface ImageTransitionProps {
  imageUrl: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  enableScrub?: boolean;
  className?: string;
}

export interface TimelineControllerOptions {
  totalDuration: number;
  tweenDuration?: number;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  onTimeUpdate: (time: number) => void;
}
