export const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';

export const DEMO_CONTROL_STYLES = `
  .demo-image-controls {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 10;
    width: min(360px, calc(100vw - 32px));
    padding: 16px;
    border-radius: 10px;
    background: rgba(20, 20, 20, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #f5f5f5;
    font: 14px/1.4 system-ui, sans-serif;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  }

  .demo-image-controls h2 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .demo-image-controls__tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .demo-image-controls__tab {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .demo-image-controls__tab.is-active {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.28);
  }

  .demo-image-controls__panel {
    display: none;
    flex-direction: column;
    gap: 10px;
  }

  .demo-image-controls__panel.is-active {
    display: flex;
  }

  .demo-image-controls input[type='text'],
  .demo-image-controls textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.35);
    color: inherit;
    resize: vertical;
  }

  .demo-image-controls textarea {
    min-height: 88px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
  }

  .demo-image-controls input[type='file'] {
    width: 100%;
    color: inherit;
  }

  .demo-image-controls__actions {
    display: flex;
    gap: 8px;
  }

  .demo-image-controls__button {
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    color: inherit;
    cursor: pointer;
  }

  .demo-image-controls__button:hover {
    background: rgba(255, 255, 255, 0.14);
  }

  .demo-image-controls__hint {
    margin: 0;
    color: rgba(255, 255, 255, 0.65);
    font-size: 12px;
  }

  .demo-image-controls__error {
    margin: 0;
    color: #ff8a80;
    font-size: 12px;
  }
`;
