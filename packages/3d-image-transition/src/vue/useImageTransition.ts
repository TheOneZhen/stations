import {
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
} from '../core/constants';
import { SceneController } from '../three/sceneController';
import type { ImageSource } from '../types';

export interface UseImageTransitionOptions {
  image: MaybeRefOrGetter<ImageSource>;
  width?: MaybeRefOrGetter<number>;
  height?: MaybeRefOrGetter<number>;
  autoplay?: MaybeRefOrGetter<boolean>;
  enableScrub?: MaybeRefOrGetter<boolean>;
}

export function useImageTransition(
  options: UseImageTransitionOptions,
): Ref<HTMLDivElement | null> {
  const containerRef = ref<HTMLDivElement | null>(null);
  let controller: SceneController | null = null;
  let generation = 0;

  const disposeController = (): void => {
    controller?.dispose();
    controller = null;
  };

  watch(
    () =>
      [
        containerRef.value,
        toValue(options.image),
        toValue(options.width ?? DEFAULT_SLIDE_WIDTH),
        toValue(options.height ?? DEFAULT_SLIDE_HEIGHT),
        toValue(options.autoplay ?? true),
        toValue(options.enableScrub ?? true),
      ] as const,
    async ([container, image, width, height, autoplay, enableScrub]) => {
      const gen = ++generation;
      disposeController();
      if (!container) return;

      const instance = await SceneController.create(container, {
        width,
        height,
        image,
        autoplay,
        enableScrub,
      });

      if (gen !== generation) {
        instance.dispose();
        return;
      }

      controller = instance;
    },
    { flush: 'post' },
  );

  onBeforeUnmount(() => {
    generation += 1;
    disposeController();
  });

  return containerRef;
}
