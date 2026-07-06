/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { attachScrubListeners, createTimelineController } from '../src/core/timelineController';

describe('attachScrubListeners', () => {
  it('seeks timeline on mouse drag and restores cursor on cleanup', () => {
    const seekByDelta = vi.fn();
    const stopScrub = vi.fn();
    const resumeScrub = vi.fn();
    const controller = {
      seekByDelta,
      stopScrub,
      resumeScrub,
      play: vi.fn(),
      pause: vi.fn(),
      togglePause: vi.fn(),
      isPaused: vi.fn(),
      setProgress: vi.fn(),
      getProgress: vi.fn(),
      dispose: vi.fn(),
    };

    const target = document.createElement('div');
    document.body.appendChild(target);

    const dispose = attachScrubListeners(controller, target);

    expect(document.body.style.cursor).toBe('pointer');

    target.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }));
    expect(stopScrub).toHaveBeenCalled();
    expect(document.body.style.cursor).toBe('ew-resize');

    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, bubbles: true }));
    expect(seekByDelta).toHaveBeenCalledWith(50);

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(resumeScrub).toHaveBeenCalled();

    dispose();
    expect(document.body.style.cursor).toBe('');
    document.body.removeChild(target);
  });
});

describe('createTimelineController scrub helpers', () => {
  it('can stop and resume scrub without throwing', () => {
    const controller = createTimelineController({
      totalDuration: 1,
      tweenDuration: 0.01,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false,
      onTimeUpdate: () => {},
    });

    controller.stopScrub();
    controller.stopScrub();
    controller.resumeScrub();
    controller.resumeScrub();

    controller.dispose();
  });
});
