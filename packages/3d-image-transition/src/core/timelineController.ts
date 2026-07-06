import gsap from 'gsap';
import { clamp } from './animationParams';
import { SCRUB_SEEK_SPEED, TWEEN_DURATION } from './constants';
import type { TimelineControllerOptions } from '../types';

export interface TimelineController {
  play: () => void;
  pause: () => void;
  togglePause: () => void;
  isPaused: () => boolean;
  seekByDelta: (dx: number, seekSpeed?: number) => void;
  setProgress: (progress: number) => void;
  getProgress: () => number;
  stopScrub: () => void;
  resumeScrub: () => void;
  dispose: () => void;
}

export function createTimelineController(
  options: TimelineControllerOptions,
): TimelineController {
  const {
    totalDuration,
    tweenDuration = TWEEN_DURATION,
    repeat = -1,
    repeatDelay = 1,
    yoyo = true,
    onTimeUpdate,
  } = options;

  const timeline = gsap.timeline({
    repeat,
    repeatDelay,
    yoyo,
    paused: false,
  });

  const timeProxy = { time: 0 };

  timeline.to(timeProxy, {
    time: totalDuration,
    duration: tweenDuration,
    ease: 'none',
    onUpdate: () => {
      onTimeUpdate(timeProxy.time);
    },
  });

  let scrubPaused = false;

  return {
    play: () => {
      timeline.play();
    },
    pause: () => {
      timeline.pause();
    },
    togglePause: () => {
      timeline.paused(!timeline.paused());
    },
    isPaused: () => timeline.paused(),
    seekByDelta: (dx, seekSpeed = SCRUB_SEEK_SPEED) => {
      const progress = timeline.progress();
      const next = clamp(progress + dx * seekSpeed, 0, 1);
      timeline.progress(next);
    },
    setProgress: (progress) => {
      timeline.progress(clamp(progress, 0, 1));
    },
    getProgress: () => timeline.progress(),
    stopScrub: () => {
      if (scrubPaused) return;
      scrubPaused = true;
      gsap.to(timeline, { timeScale: 0, duration: 1 });
    },
    resumeScrub: () => {
      if (!scrubPaused) return;
      scrubPaused = false;
      gsap.to(timeline, { timeScale: 1, duration: 1 });
    },
    dispose: () => {
      timeline.kill();
    },
  };
}

export function attachScrubListeners(
  controller: TimelineController,
  target: HTMLElement | Window = window,
): () => void {
  let mouseDown = false;
  let lastClientX = 0;

  const onMouseDown = (event: MouseEvent) => {
    mouseDown = true;
    lastClientX = event.clientX;
    controller.stopScrub();
    document.body.style.cursor = 'ew-resize';
  };

  const onMouseUp = () => {
    mouseDown = false;
    controller.resumeScrub();
    document.body.style.cursor = 'pointer';
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!mouseDown) return;
    const dx = event.clientX - lastClientX;
    lastClientX = event.clientX;
    controller.seekByDelta(dx);
  };

  const onTouchStart = (event: TouchEvent) => {
    lastClientX = event.touches[0].clientX;
    controller.stopScrub();
    event.preventDefault();
  };

  const onTouchEnd = (event: TouchEvent) => {
    controller.resumeScrub();
    event.preventDefault();
  };

  const onTouchMove = (event: TouchEvent) => {
    const dx = event.touches[0].clientX - lastClientX;
    lastClientX = event.touches[0].clientX;
    controller.seekByDelta(dx);
    event.preventDefault();
  };

  target.addEventListener('mousedown', onMouseDown as EventListener);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  target.addEventListener('touchstart', onTouchStart as EventListener, { passive: false });
  window.addEventListener('touchend', onTouchEnd as EventListener, { passive: false });
  window.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });

  document.body.style.cursor = 'pointer';

  return () => {
    target.removeEventListener('mousedown', onMouseDown as EventListener);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
    target.removeEventListener('touchstart', onTouchStart as EventListener);
    window.removeEventListener('touchend', onTouchEnd as EventListener);
    window.removeEventListener('touchmove', onTouchMove as EventListener);
    document.body.style.cursor = '';
  };
}
