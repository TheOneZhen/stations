import { Mesh, ShaderMaterial, Texture, TextureLoader } from 'three';
import { buildSlideFaces } from '../core/faceDataBuilder';
import { createSlideGeometry, createSlideMaterial } from './createSlideGeometry';
import type { AnimationPhase, ImageSource } from '../types';

export class SlideMesh extends Mesh {
  readonly totalDuration: number;

  constructor(width: number, height: number, phase: AnimationPhase, texture: Texture) {
    const widthSegments = width * 2;
    const heightSegments = height * 2;
    const { faces, totalDuration } = buildSlideFaces({
      width,
      height,
      widthSegments,
      heightSegments,
      phase,
    });

    const geometry = createSlideGeometry(faces);
    const material = createSlideMaterial(phase, texture);

    super(geometry, material);

    this.frustumCulled = false;
    this.totalDuration = totalDuration;
  }

  private get shaderMaterial(): ShaderMaterial {
    return this.material as ShaderMaterial;
  }

  get time(): number {
    return this.shaderMaterial.uniforms.uTime.value as number;
  }

  set time(value: number) {
    this.shaderMaterial.uniforms.uTime.value = value;
  }

  setTexture(texture: Texture): void {
    this.shaderMaterial.uniforms.map.value = texture;
    this.shaderMaterial.uniforms.map.value.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    this.shaderMaterial.dispose();
  }
}

function resolveImageUrl(source: ImageSource): { url: string; revoke?: () => void } {
  if (typeof source === 'string') {
    return { url: source };
  }

  const url = URL.createObjectURL(source);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}

function shouldSetCrossOrigin(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function loadTexture(source: ImageSource): Promise<Texture> {
  const { url, revoke } = resolveImageUrl(source);
  const loader = new TextureLoader();

  if (shouldSetCrossOrigin(url)) {
    loader.setCrossOrigin('anonymous');
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        revoke?.();
        resolve(texture);
      },
      undefined,
      (error) => {
        revoke?.();
        reject(error);
      },
    );
  });
}
