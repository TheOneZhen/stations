# Clipboard Image Paste

Paste clipboard images into your workspace and insert a file reference at the cursor.

## Features

- Save clipboard images (PNG, JPEG, WebP, GIF, SVG, BMP) to a configurable path
- Insert language-specific references (Markdown, HTML, and custom templates)
- Dynamic path placeholders: `[YYYY-MM-DD]`, `[YYYY-MM-DD HH:mm:ss]`, `[RID-8]`, etc.
- Select `altText` after insert so you can rename it immediately
- Global and workspace settings
- Shortcut: `Ctrl+Alt+V` (`Cmd+Alt+V` on macOS)
- Editor context menu entry

## Usage

1. Copy an image to the clipboard (screenshot or copied image file)
2. Open a supported file in the editor
3. Press `Ctrl+Alt+V` or use **Paste Clipboard Image** from the context menu
4. The image is saved and a reference is inserted at the cursor

Example for Markdown:

- Template: `![altText](./images/[YYYY-MM-DD])`
- Saved file: `./images/2026-07-09.png` (relative to the current document)
- Inserted text: `![altText](./images/2026-07-09.png)`
- `altText` is selected for editing

## Configuration

Settings namespace: `clipboardImagePaste`

### `clipboardImagePaste.templates`

Map VS Code **languageId** to an insert template.

Default:

```json
{
  "markdown": "![altText](./images/[YYYY-MM-DD])",
  "html": "<img alt=\"altText\" src=\"./images/[YYYY-MM-DD]\" />"
}
```

Notes:

- Use literal `altText` if you want the alt text selected after paste
- The image path inside the template is also used as the save location
- Templates are matched by `languageId` (for example `markdown`, not `md`)

### `clipboardImagePaste.supportedImageExtensions`

Allowed output extensions when saving images.

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `[YYYY-MM-DD]` | Date format via dayjs | `2026-07-09` |
| `[YYYY-MM-DD HH:mm:ss]` | Date-time format | `2026-07-09 18-26-33` |
| `[RID-N]` | Random `A-Z0-9` string, length `N` | `[RID-4]` → `YAUS` |

Rules:

- Placeholders must be wrapped in `[]`
- Multiple identical placeholders in one paste resolve to the same value
- If the resolved path has no extension, the clipboard image extension is appended
- Relative paths are resolved from the current file directory
- Absolute paths are supported

## Filename collisions

If `./images/2026-07-09.png` already exists, the extension tries:

- `./images/2026-07-09-1.png`
- `./images/2026-07-09-2.png`
- ...

## Known limitations

1. **Windows filenames**: characters such as `:` are replaced with `-` after date formatting
2. **`altText` is a convention**: only the literal string `altText` is auto-selected unless the language-specific parser applies
3. **Save path equals reference path**: v1 does not support saving to one location while inserting another
4. **Clipboard SVG**: copied files work; screenshot clipboard content is usually rasterized as PNG
5. **languageId matching**: configure `markdown`, `html`, etc., not file extensions like `md`

## Development

```bash
pnpm --filter vscode-clipboard-image-paste install
pnpm --filter vscode-clipboard-image-paste compile
pnpm --filter vscode-clipboard-image-paste test
```

Press `F5` in this package folder to launch an Extension Development Host.

## Clipboard reading strategy

1. Clipboard text that points to an image file
2. Windows PowerShell clipboard image read
3. Hidden webview clipboard bridge fallback

This works around VS Code's text-only clipboard API while staying compatible with remote workflows via `workspace.fs`.
