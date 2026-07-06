import { SceneController } from '../src/three/sceneController';
import { mountImageControls } from './imageControls';
import { SAMPLE_IMAGE } from './shared';

async function main(): Promise<void> {
  const container = document.getElementById('app');

  if (!container) {
    throw new Error('Missing #app container element');
  }

  const controller = await SceneController.create(container, {
    width: 100,
    height: 60,
    image: SAMPLE_IMAGE,
    autoplay: true,
    enableScrub: true,
  });

  const disposeControls = mountImageControls({
    onChange: (image) => {
      void controller.setImage(image);
    },
  });

  window.addEventListener('beforeunload', () => {
    disposeControls();
    controller.dispose();
  });
}

main();
