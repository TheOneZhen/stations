export { ImageTransition } from './react/ImageTransition';
export { useImageTransition } from './react/useImageTransition';
export { SceneController } from './three/sceneController';
export { SlideMesh, loadTexture } from './three/SlideMesh';
export { buildSlideFaces, getExpectedFaceCount } from './core/faceDataBuilder';
export {
  computeFaceAnimationParams,
  computeTotalDuration,
  mapLinear,
  clamp,
} from './core/animationParams';
export {
  getControlPoint0,
  getControlPoint1,
  computeBezierControls,
} from './core/controlPoints';
export {
  createTimelineController,
  attachScrubListeners,
} from './core/timelineController';
export type {
  AnimationPhase,
  ImageSource,
  ImageTransitionProps,
  FaceAnimationData,
  SlideGridConfig,
  SlideBuildResult,
  SceneControllerOptions,
} from './types';
