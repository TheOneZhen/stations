import { describe, expect, it, vi } from 'vitest';
import { createTimelineController } from '../src/core/timelineController';

describe('timelineController', () => {
  it('updates time through the gsap timeline', () => {
    const onTimeUpdate = vi.fn();
    const controller = createTimelineController({
      totalDuration: 2,
      tweenDuration: 0.01,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false,
      onTimeUpdate,
    });

    controller.setProgress(1);
    expect(onTimeUpdate).toHaveBeenCalled();
    expect(onTimeUpdate.mock.calls.at(-1)?.[0]).toBeCloseTo(2, 1);

    controller.dispose();
  });

  it('clamps seek progress to [0, 1]', () => {
    const onTimeUpdate = vi.fn();
    const controller = createTimelineController({
      totalDuration: 2,
      tweenDuration: 0.01,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false,
      onTimeUpdate,
    });

    controller.seekByDelta(-999999, 1);
    expect(controller.getProgress()).toBe(0);

    controller.seekByDelta(999999, 1);
    expect(controller.getProgress()).toBe(1);

    controller.dispose();
  });

  it('tracks pause state', () => {
    const controller = createTimelineController({
      totalDuration: 2,
      onTimeUpdate: () => {},
    });

    controller.pause();
    expect(controller.isPaused()).toBe(true);

    controller.togglePause();
    expect(controller.isPaused()).toBe(false);

    controller.dispose();
  });
});
