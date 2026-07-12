# Clipboard File Paste

Paste clipboard files into your workspace and insert a file reference at the cursor.

## Features

- Save clipboard content (files, images, plain text) to a configurable path
- Insert language-specific references (Markdown, HTML, and custom templates)
- Dynamic path placeholders: `[YYYY-MM-DD]`, `[YYYY-MM-DD-HH-mm-ss]`, `[RID-8]`, etc.
- Template placeholders: `[dirname]`, `[filename]`
- Select `altText` after insert so you can rename it immediately
- Global and workspace settings
- Shortcut: `Ctrl+Alt+V` (`Cmd+Alt+V` on macOS)
- Editor context menu entry

## Usage

1. Copy content to the clipboard (file path, screenshot, plain text, etc.)
2. Open a supported file in the editor
3. Press `Ctrl+Alt+V` or use **Paste Clipboard File** from the context menu
4. The file is saved and a reference is inserted at the cursor

Example for Markdown:

- Config:
  - `dirname`: `./images/`
  - `filename`: `[YYYY-MM-DD-HH-mm-ss]`
  - `template`: `![altText]([dirname]/[filename])`
- Saved file: `./images/2026-07-09-19-30-45.png` (relative to the current document)
- Inserted text: `![altText](./images/2026-07-09-19-30-45.png)`
- `altText` is selected for editing

## Configuration

Settings namespace: `clipboardImagePaste`

### `clipboardImagePaste.templates`

Map VS Code **languageId** to paste settings.

Default:

```json
{
  "markdown": {
    "dirname": "./images/",
    "filename": "[YYYY-MM-DD-HH-mm-ss]",
    "template": "![altText]([dirname]/[filename])"
  },
  "html": {
    "dirname": "./images/",
    "filename": "[YYYY-MM-DD-HH-mm-ss]",
    "template": "<img alt=\"altText\" src=\"[dirname]/[filename]\" />"
  }
}
```

Notes:

- `dirname` and `filename` support date/RID placeholders
- `template` uses `[dirname]` and `[filename]` for the inserted reference
- Use literal `altText` if you want the alt text selected after paste
- Templates are matched by `languageId` (for example `markdown`, not `md`)

### `clipboardImagePaste.defaultTextExtension`

Extension used when pasting plain text from the clipboard. Default: `txt`.

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `[YYYY-MM-DD]` | Date format via dayjs | `2026-07-09` |
| `[YYYY-MM-DD-HH-mm-ss]` | Date-time format | `2026-07-09-19-30-45` |
| `[RID-N]` | Random `A-Z0-9` string, length `N` | `[RID-4]` → `YAUS` |
| `[dirname]` | Resolved save directory in `template` | `./images/` |
| `[filename]` | Resolved file name in `template` | `2026-07-09.png` |

Rules:

- Date/RID placeholders must be wrapped in `[]`
- Multiple identical placeholders in one paste resolve to the same value
- If the resolved filename has no extension, the clipboard file extension is appended
- Relative paths are resolved from the current file directory
- Absolute paths are supported

## Clipboard sources

| Source | Behavior |
|--------|----------|
| File path in clipboard | Reads any existing file and preserves its extension |
| Plain text | Saves as UTF-8 using `defaultTextExtension` |
| Image binary | Uses PowerShell (Windows) or Webview bridge fallback, saved as PNG |

## Filename collisions

If `./images/2026-07-09.png` already exists, the extension tries:

- `./images/2026-07-09-1.png`
- `./images/2026-07-09-2.png`
- ...

## Known limitations

1. **Windows filenames**: characters such as `:` are replaced with `-` after date formatting
2. **`altText` is a convention**: only the literal string `altText` is auto-selected unless the language-specific parser applies
3. **Save path equals reference path**: v1 does not support saving to one location while inserting another
4. **Non-image binary clipboard**: only image binary fallback is supported outside file-path text
5. **languageId matching**: configure `markdown`, `html`, etc., not file extensions like `md`

## Development

```bash
pnpm --filter vscode-clipboard-image-paste install
pnpm --filter vscode-clipboard-image-paste compile
pnpm --filter vscode-clipboard-image-paste test
```

Press `F5` in this package folder to launch an Extension Development Host.

## Clipboard reading strategy

1. Clipboard text that points to an existing file path
2. Clipboard plain text saved as a text file
3. Windows PowerShell clipboard image read
4. Hidden webview clipboard bridge fallback for images

This works around VS Code's text-only clipboard API while staying compatible with remote workflows via `workspace.fs`.
