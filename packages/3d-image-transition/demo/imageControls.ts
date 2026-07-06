import type { ImageSource } from '../src/types';
import { DEMO_CONTROL_STYLES, SAMPLE_IMAGE } from './shared';

type ImageSourceMode = 'url' | 'dataUrl' | 'file';

export interface MountImageControlsOptions {
  onChange: (image: ImageSource) => void;
  initialImage?: ImageSource;
}

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

function ensureStyles(): void {
  if (document.getElementById('demo-image-control-styles')) return;

  const style = document.createElement('style');
  style.id = 'demo-image-control-styles';
  style.textContent = DEMO_CONTROL_STYLES;
  document.head.appendChild(style);
}

export function mountImageControls({
  onChange,
  initialImage = SAMPLE_IMAGE,
}: MountImageControlsOptions): () => void {
  ensureStyles();

  const root = document.createElement('section');
  root.className = 'demo-image-controls';
  root.innerHTML = `
    <h2>图片导入</h2>
    <div class="demo-image-controls__tabs" role="tablist">
      <button type="button" class="demo-image-controls__tab is-active" data-mode="url">URL</button>
      <button type="button" class="demo-image-controls__tab" data-mode="dataUrl">Data URL</button>
      <button type="button" class="demo-image-controls__tab" data-mode="file">File</button>
    </div>
    <div class="demo-image-controls__panel is-active" data-panel="url">
      <input type="text" data-url-input placeholder="https://example.com/image.jpg" />
      <div class="demo-image-controls__actions">
        <button type="button" class="demo-image-controls__button" data-apply-url>应用 URL</button>
        <button type="button" class="demo-image-controls__button" data-reset-url>示例 URL</button>
      </div>
      <p class="demo-image-controls__hint">支持 HTTP(S) 远程图片地址。</p>
    </div>
    <div class="demo-image-controls__panel" data-panel="dataUrl">
      <textarea data-data-url-input placeholder="data:image/png;base64,..."></textarea>
      <div class="demo-image-controls__actions">
        <button type="button" class="demo-image-controls__button" data-apply-data-url>应用 Data URL</button>
        <button type="button" class="demo-image-controls__button" data-load-sample-data-url>示例转 Data URL</button>
      </div>
      <p class="demo-image-controls__hint">支持粘贴 base64 或完整 data URL。</p>
      <p class="demo-image-controls__error" data-data-url-error hidden></p>
    </div>
    <div class="demo-image-controls__panel" data-panel="file">
      <input type="file" accept="image/*" data-file-input />
      <p class="demo-image-controls__hint">选择本地图片文件，选择后立即应用。</p>
    </div>
  `;

  document.body.appendChild(root);

  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.demo-image-controls__tab'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('.demo-image-controls__panel'));
  const urlInput = root.querySelector<HTMLInputElement>('[data-url-input]')!;
  const dataUrlInput = root.querySelector<HTMLTextAreaElement>('[data-data-url-input]')!;
  const dataUrlError = root.querySelector<HTMLElement>('[data-data-url-error]')!;
  const fileInput = root.querySelector<HTMLInputElement>('[data-file-input]')!;

  urlInput.value = typeof initialImage === 'string' ? initialImage : SAMPLE_IMAGE;

  const setMode = (mode: ImageSourceMode): void => {
    tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.mode === mode);
    });
    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === mode);
    });
  };

  const showDataUrlError = (message: string): void => {
    dataUrlError.textContent = message;
    dataUrlError.hidden = false;
  };

  const clearDataUrlError = (): void => {
    dataUrlError.textContent = '';
    dataUrlError.hidden = true;
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setMode(tab.dataset.mode as ImageSourceMode);
    });
  });

  root.querySelector('[data-apply-url]')!.addEventListener('click', () => {
    const value = urlInput.value.trim();
    if (!value) return;
    onChange(value);
  });

  root.querySelector('[data-reset-url]')!.addEventListener('click', () => {
    urlInput.value = SAMPLE_IMAGE;
    onChange(SAMPLE_IMAGE);
  });

  root.querySelector('[data-apply-data-url]')!.addEventListener('click', () => {
    clearDataUrlError();
    const value = dataUrlInput.value.trim();
    if (!value) return;

    const dataUrl = value.startsWith('data:')
      ? value
      : `data:image/png;base64,${value}`;

    onChange(dataUrl);
  });

  root.querySelector('[data-load-sample-data-url]')!.addEventListener('click', async () => {
    clearDataUrlError();

    try {
      const dataUrl = await urlToDataUrl(SAMPLE_IMAGE);
      dataUrlInput.value = dataUrl;
      onChange(dataUrl);
    } catch (error) {
      showDataUrlError(
        error instanceof Error ? error.message : '无法将示例 URL 转为 Data URL',
      );
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    onChange(file);
  });

  return () => {
    root.remove();
  };
}
