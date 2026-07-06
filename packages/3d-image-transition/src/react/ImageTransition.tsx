import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
} from '../core/constants';
import { useImageTransition } from './useImageTransition';
import type { ImageTransitionProps } from '../types';

export function ImageTransition({
  image,
  width = DEFAULT_SLIDE_WIDTH,
  height = DEFAULT_SLIDE_HEIGHT,
  autoplay = true,
  enableScrub = true,
  className,
}: ImageTransitionProps) {
  const containerRef = useImageTransition({
    image,
    width,
    height,
    autoplay,
    enableScrub,
  });

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
