import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  ShaderMaterial,
  Texture,
} from 'three';
import type { FaceAnimationData } from '../types';
import { createSlideVertexShader, SLIDE_FRAGMENT_SHADER } from './shaders';
import type { AnimationPhase } from '../types';

export function createSlideGeometry(faces: FaceAnimationData[]): BufferGeometry {
  const vertexCount = faces.length * 3;
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const aAnimation = new Float32Array(vertexCount * 2);
  const aStartPosition = new Float32Array(vertexCount * 3);
  const aControl0 = new Float32Array(vertexCount * 3);
  const aControl1 = new Float32Array(vertexCount * 3);
  const aEndPosition = new Float32Array(vertexCount * 3);

  faces.forEach((face, faceIndex) => {
    const base = faceIndex * 3;

    face.localVertices.forEach((vertex, vertexIndex) => {
      const i = base + vertexIndex;
      positions[i * 3] = vertex.x;
      positions[i * 3 + 1] = vertex.y;
      positions[i * 3 + 2] = vertex.z;

      uvs[i * 2] = face.uvs[vertexIndex].x;
      uvs[i * 2 + 1] = face.uvs[vertexIndex].y;

      aAnimation[i * 2] = face.delay;
      aAnimation[i * 2 + 1] = face.duration;

      aStartPosition[i * 3] = face.start.x;
      aStartPosition[i * 3 + 1] = face.start.y;
      aStartPosition[i * 3 + 2] = face.start.z;

      aControl0[i * 3] = face.control0.x;
      aControl0[i * 3 + 1] = face.control0.y;
      aControl0[i * 3 + 2] = face.control0.z;

      aControl1[i * 3] = face.control1.x;
      aControl1[i * 3 + 1] = face.control1.y;
      aControl1[i * 3 + 2] = face.control1.z;

      aEndPosition[i * 3] = face.end.x;
      aEndPosition[i * 3 + 1] = face.end.y;
      aEndPosition[i * 3 + 2] = face.end.z;
    });
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setAttribute('aAnimation', new BufferAttribute(aAnimation, 2));
  geometry.setAttribute('aStartPosition', new BufferAttribute(aStartPosition, 3));
  geometry.setAttribute('aControl0', new BufferAttribute(aControl0, 3));
  geometry.setAttribute('aControl1', new BufferAttribute(aControl1, 3));
  geometry.setAttribute('aEndPosition', new BufferAttribute(aEndPosition, 3));

  return geometry;
}

export function createSlideMaterial(
  phase: AnimationPhase,
  texture: Texture,
): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      map: { value: texture },
    },
    vertexShader: createSlideVertexShader(phase),
    fragmentShader: SLIDE_FRAGMENT_SHADER,
    side: DoubleSide,
    transparent: true,
  });
}
