import {
  PerspectiveCamera,
  Scene,
  Texture,
  WebGLRenderer,
} from 'three';
import {
  attachScrubListeners,
  createTimelineController,
  type TimelineController,
} from '../core/timelineController';
import {
  DEFAULT_CAMERA_Z,
  DEFAULT_FOV,
  REPEAT_DELAY,
} from '../core/constants';
import { loadTexture, SlideMesh } from './SlideMesh';
import type { ImageSource, SceneControllerOptions } from '../types';

export class SceneController {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly slideOut: SlideMesh;
  readonly slideIn: SlideMesh;

  private readonly container: HTMLElement;
  private readonly timeline: TimelineController;
  private readonly disposeScrub: (() => void) | null;
  private readonly onKeyUp: (event: KeyboardEvent) => void;
  private readonly onResize: () => void;
  private animationFrameId = 0;
  private disposed = false;
  private texture: Texture | null = null;

  private constructor(
    container: HTMLElement,
    renderer: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    slideOut: SlideMesh,
    slideIn: SlideMesh,
    timeline: TimelineController,
    disposeScrub: (() => void) | null,
    texture: Texture,
  ) {
    this.container = container;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.slideOut = slideOut;
    this.slideIn = slideIn;
    this.timeline = timeline;
    this.disposeScrub = disposeScrub;
    this.texture = texture;

    this.onResize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    this.onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'KeyP') {
        timeline.togglePause();
      }
    };

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keyup', this.onKeyUp);

    this.tick();
  }

  static async create(
    container: HTMLElement,
    options: SceneControllerOptions,
  ): Promise<SceneController> {
    const {
      width,
      height,
      image,
      autoplay = true,
      enableScrub = true,
      fov = DEFAULT_FOV,
      antialias = window.devicePixelRatio === 1,
    } = options;

    const texture = await loadTexture(image);

    const renderer = new WebGLRenderer({
      antialias,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(fov, 1, 10, 100000);
    camera.position.set(0, 0, DEFAULT_CAMERA_Z);

    const slideOut = new SlideMesh(width, height, 'out', texture);
    const slideIn = new SlideMesh(width, height, 'in', texture);
    scene.add(slideOut);
    scene.add(slideIn);

    const totalDuration = Math.max(slideOut.totalDuration, slideIn.totalDuration);

    const timeline = createTimelineController({
      totalDuration,
      repeat: -1,
      repeatDelay: REPEAT_DELAY,
      yoyo: true,
      onTimeUpdate: (time) => {
        slideOut.time = time;
        slideIn.time = time;
      },
    });

    if (!autoplay) {
      timeline.pause();
    }

    const disposeScrub = enableScrub
      ? attachScrubListeners(timeline, container)
      : null;

    const controller = new SceneController(
      container,
      renderer,
      scene,
      camera,
      slideOut,
      slideIn,
      timeline,
      disposeScrub,
      texture,
    );

    controller.onResize();
    return controller;
  }

  async setImage(image: ImageSource): Promise<void> {
    const texture = await loadTexture(image);
    this.texture?.dispose();
    this.texture = texture;
    this.slideOut.setTexture(texture);
    this.slideIn.setTexture(texture);
  }

  private tick = (): void => {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keyup', this.onKeyUp);
    this.disposeScrub?.();
    this.timeline.dispose();

    this.slideOut.dispose();
    this.slideIn.dispose();
    this.texture?.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
