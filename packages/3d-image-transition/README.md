# @zhenisbusy/3d-image-transition

> GitHub: https://github.com/TheOneZhen/stations/tree/master/packages/3d-image-transition
> demo: https://stations.zhenisbusy.site/3d-image-transition/index.html

A WebGL image transition effect that splits a photo into hundreds of animated tiles, each flying along a cubic Bézier path. Inspired by [this CodePen demo](https://codepen.io/zadvorsky/pen/PNXbGo) by Zadvorsky.

Built with **Three.js** and **GSAP**. Works in plain TypeScript/JavaScript, **React 18**, and **Vue 3**.

## Features

- **3D tile transition** — subdivides an image plane into triangles and animates each face independently
- **Dual-phase animation** — overlapping “in” and “out” layers create a continuous loop
- **Multiple image sources** — HTTP(S) URL, base64 data URL, `File`, or `Blob`
- **Interactive scrubbing** — drag horizontally to scrub the timeline; release to resume
- **Keyboard control** — press `P` to pause / resume
- **Framework adapters** — use the core API directly, or drop in React / Vue components
- **Tree-shakeable ESM** — React and Vue are optional peer dependencies

## Installation

```bash
npm install @zhenisbusy/3d-image-transition
```

### Peer dependencies

Install the runtime dependencies your app needs:

```bash
# Required for all usage
npm install three gsap

# React (main entry)
npm install react react-dom

# Vue (vue subpath only)
npm install vue
```

| Package     | Required when                               |
| ----------- | ------------------------------------------- |
| `three`     | Always                                      |
| `gsap`      | Always                                      |
| `react`     | Using the main entry                        |
| `react-dom` | Using the main entry                        |
| `vue`       | Using `@zhenisbusy/3d-image-transition/vue` |

## Quick start

### TypeScript / JavaScript

Use `SceneController` when you do not need React or Vue.

```ts
import { SceneController } from '@zhenisbusy/3d-image-transition';

const container = document.getElementById('app');
if (!container) throw new Error('Missing container');

const controller = await SceneController.create(container, {
  width: 100,
  height: 60,
  image: 'https://example.com/photo.jpg',
  autoplay: true,
  enableScrub: true,
});

// Swap image at runtime (URL, data URL, File, or Blob)
await controller.setImage(fileFromInput);

// Clean up when done
controller.dispose();
```

Give the container explicit dimensions in CSS:

```css
#app {
  width: 100%;
  height: 100vh;
}
```

### React

```tsx
import { ImageTransition } from '@zhenisbusy/3d-image-transition';

export function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ImageTransition
        image="https://example.com/photo.jpg"
        width={100}
        height={60}
        autoplay
        enableScrub
      />
    </div>
  );
}
```

**Hook API** — for custom layouts:

```tsx
import { useImageTransition } from '@zhenisbusy/3d-image-transition';

function CustomTransition() {
  const containerRef = useImageTransition({
    image: 'https://example.com/photo.jpg',
    width: 100,
    height: 60,
  });

  return <div ref={containerRef} className="transition-host" />;
}
```

### Vue 3

Import from the `/vue` subpath:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { ImageTransition } from '@zhenisbusy/3d-image-transition/vue';

const image = ref('https://example.com/photo.jpg');
</script>

<template>
  <div class="transition-host">
    <ImageTransition
      :image="image"
      :width="100"
      :height="60"
      autoplay
      enable-scrub
    />
  </div>
</template>

<style scoped>
.transition-host {
  width: 100%;
  height: 100vh;
}
</style>
```

**Composable API**:

```vue
<script setup lang="ts">
import { useImageTransition } from '@zhenisbusy/3d-image-transition/vue';

const containerRef = useImageTransition({
  image: () => 'https://example.com/photo.jpg',
  width: 100,
  height: 60,
});
</script>

<template>
  <div ref="containerRef" class="transition-host" />
</template>
```

## Image sources

The `image` prop / option accepts:

| Type     | Example                                     |
| -------- | ------------------------------------------- |
| URL      | `'https://example.com/photo.jpg'`           |
| Data URL | `'data:image/png;base64,...'`               |
| File     | `input.files[0]` from `<input type="file">` |
| Blob     | `await fetch(url).then(r => r.blob())`      |

Remote URLs must allow cross-origin access (CORS) when loaded over HTTP(S).

## API

### `<ImageTransition />` (React & Vue)

| Prop / attribute | Type          | Default | Description                      |
| ---------------- | ------------- | ------- | -------------------------------- |
| `image`          | `ImageSource` | —       | Image to display                 |
| `width`          | `number`      | `100`   | Slide plane width (world units)  |
| `height`         | `number`      | `60`    | Slide plane height (world units) |
| `autoplay`       | `boolean`     | `true`  | Start animation on mount         |
| `enableScrub`    | `boolean`     | `true`  | Enable drag-to-scrub interaction |
| `className`      | `string`      | —       | CSS class on the host element    |

### `SceneController`

| Method / option                              | Description                                 |
| -------------------------------------------- | ------------------------------------------- |
| `SceneController.create(container, options)` | Mount renderer and start animation          |
| `setImage(image)`                            | Replace the texture at runtime              |
| `dispose()`                                  | Stop animation and free GPU / DOM resources |

**`SceneControllerOptions`**

| Option        | Type          | Default              | Description             |
| ------------- | ------------- | -------------------- | ----------------------- |
| `width`       | `number`      | —                    | Slide plane width       |
| `height`      | `number`      | —                    | Slide plane height      |
| `image`       | `ImageSource` | —                    | Initial image           |
| `autoplay`    | `boolean`     | `true`               | Auto-start timeline     |
| `enableScrub` | `boolean`     | `true`               | Mouse / touch scrubbing |
| `fov`         | `number`      | `80`                 | Camera field of view    |
| `antialias`   | `boolean`     | `true` when DPR is 1 | WebGL antialiasing      |

### Low-level exports

The main entry also exports building blocks for custom integrations:

- `SlideMesh`, `loadTexture`
- `buildSlideFaces`, `createTimelineController`, `attachScrubListeners`
- Animation utilities: `computeFaceAnimationParams`, `computeBezierControls`, etc.

## Interactions

- **Scrub** — click (or touch) and drag horizontally on the canvas to scrub
- **Pause** — press `P` to toggle pause / resume

## Browser support

Any browser with **WebGL** support. ES modules are required.

## Development

From the monorepo package directory:

```bash
pnpm install
pnpm dev          # run local demo
pnpm test         # unit tests
pnpm build:lib    # build npm package (outputs dist/)
```

## License

ISC

## Acknowledgements

- Original effect: [PNXbGo by Zadvorsky](https://codepen.io/zadvorsky/pen/PNXbGo)
- Animation timing powered by [GSAP](https://greensock.com/gsap/)
- Rendering powered by [Three.js](https://threejs.org/)
