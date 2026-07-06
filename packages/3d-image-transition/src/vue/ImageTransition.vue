<script setup lang="ts">
import {
  DEFAULT_SLIDE_HEIGHT,
  DEFAULT_SLIDE_WIDTH,
} from '../core/constants';
import { useImageTransition } from './useImageTransition';
import type { ImageTransitionProps } from '../types';

const props = withDefaults(defineProps<ImageTransitionProps>(), {
  width: DEFAULT_SLIDE_WIDTH,
  height: DEFAULT_SLIDE_HEIGHT,
  autoplay: true,
  enableScrub: true,
});

const containerRef = useImageTransition({
  image: () => props.image,
  width: () => props.width,
  height: () => props.height,
  autoplay: () => props.autoplay,
  enableScrub: () => props.enableScrub,
});
</script>

<template>
  <div
    ref="containerRef"
    :class="props.className"
    style="width: 100%; height: 100%"
  />
</template>
