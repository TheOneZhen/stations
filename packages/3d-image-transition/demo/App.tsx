import { ImageTransition } from '../src/react/ImageTransition';

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';

export function App() {
  return (
    <ImageTransition
      imageUrl={SAMPLE_IMAGE}
      width={100}
      height={60}
      autoplay
      enableScrub
    />
  );
}
