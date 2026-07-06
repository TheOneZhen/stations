import { describe, expect, it } from 'vitest';
import { Texture } from 'three';
import { SlideMesh } from '../src/three/SlideMesh';

describe('SlideMesh', () => {
  const mockTexture = new Texture();

  it('exposes totalDuration from face builder', () => {
    const mesh = new SlideMesh(10, 6, 'in', mockTexture);
    expect(mesh.totalDuration).toBeGreaterThan(0);
    mesh.dispose();
  });

  it('reads and writes shader uTime uniform', () => {
    const mesh = new SlideMesh(10, 6, 'out', mockTexture);

    mesh.time = 1.25;
    expect(mesh.time).toBe(1.25);

    mesh.dispose();
  });

  it('swaps the map uniform via setTexture', () => {
    const mesh = new SlideMesh(10, 6, 'in', mockTexture);
    const nextTexture = new Texture();

    mesh.setTexture(nextTexture);

    expect((mesh.material as import('three').ShaderMaterial).uniforms.map.value).toBe(
      nextTexture,
    );

    mesh.dispose();
  });
});
