import { useEffect, useRef, type RefObject } from 'react';
import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
} from '../core/constants';
import { SceneController } from '../three/sceneController';
import type { ImageTransitionProps } from '../types';

export function useImageTransition({
  image,
  width = DEFAULT_SLIDE_WIDTH,
  height = DEFAULT_SLIDE_HEIGHT,
  autoplay = true,
  enableScrub = true,
}: Pick<
  ImageTransitionProps,
  'image' | 'width' | 'height' | 'autoplay' | 'enableScrub'
>): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let controller: SceneController | null = null;

    SceneController.create(container, {
      width,
      height,
      image,
      autoplay,
      enableScrub,
    }).then((instance) => {
      if (cancelled) {
        instance.dispose();
        return;
      }
      controller = instance;
    });

    return () => {
      cancelled = true;
      controller?.dispose();
    };
  }, [width, height, image, autoplay, enableScrub]);

  return containerRef;
}
