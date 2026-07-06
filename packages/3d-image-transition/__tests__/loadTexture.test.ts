import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockLoad = vi.fn();
const mockSetCrossOrigin = vi.fn();

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');

  class MockTextureLoader {
    setCrossOrigin = mockSetCrossOrigin;
    load = mockLoad;
  }

  return {
    ...actual,
    TextureLoader: MockTextureLoader,
  };
});

import { loadTexture } from '../src/three/SlideMesh';

describe('loadTexture', () => {
  beforeEach(() => {
    mockLoad.mockReset();
    mockSetCrossOrigin.mockReset();
    mockLoad.mockImplementation((_url, onLoad) => {
      onLoad({ flipY: false });
    });
  });

  it('enables crossOrigin for http(s) urls and sets flipY', async () => {
    const texture = await loadTexture('https://example.com/image.jpg');

    expect(mockSetCrossOrigin).toHaveBeenCalledWith('anonymous');
    expect(mockLoad).toHaveBeenCalledWith(
      'https://example.com/image.jpg',
      expect.any(Function),
      undefined,
      expect.any(Function),
    );
    expect(texture.flipY).toBe(true);
  });

  it('skips crossOrigin for data urls', async () => {
    await loadTexture('data:image/png;base64,abcd');

    expect(mockSetCrossOrigin).not.toHaveBeenCalled();
    expect(mockLoad).toHaveBeenCalledWith(
      'data:image/png;base64,abcd',
      expect.any(Function),
      undefined,
      expect.any(Function),
    );
  });

  it('loads File/Blob sources via object url and revokes it', async () => {
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const blob = new Blob(['test'], { type: 'image/png' });
    await loadTexture(blob);

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(mockLoad).toHaveBeenCalledWith(
      'blob:mock-url',
      expect.any(Function),
      undefined,
      expect.any(Function),
    );

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it('rejects when TextureLoader fails', async () => {
    mockLoad.mockImplementation((_url, _onLoad, _progress, onError) => {
      onError(new Error('load failed'));
    });

    await expect(loadTexture('https://example.com/missing.jpg')).rejects.toThrow(
      'load failed',
    );
  });
});
