# Clipboard File Paste

Paste clipboard content into your workspace, save it beside the active document, and insert a language-specific reference at the cursor.

## Features

- Save clipboard content (file paths, HTTP URLs, images, data URLs, plain text) beside the active document
- Insert language-specific references through configurable templates
- Dynamic path placeholders such as `[YYYY-MM-DD]`, `[YYYY-MM-DD-HH-mm-ss]`, and `[RID-4]`
- Template placeholders: `[dirname]`, `[filename]`, `[altText]`
- Select the generated alt or link text after insert when the template supports it
- Filename collision handling with `-1`, `-2`, and so on
- Shortcut: `Ctrl+Alt+V` (`Cmd+Alt+V` on macOS)
- Editor context menu entry

## Quick start

1. Copy content to the clipboard.
2. Open a supported file in the editor.
3. Press `Ctrl+Alt+V` or run **Paste Clipboard File** from the context menu.
4. The file is saved next to the active document and a reference is inserted at the cursor.

### Markdown example

Default settings:

- `dirname`: `.`
- `filename`: `[YYYY-MM-DD-HH-mm-ss]`
- `template`: `[[altText]]([dirname]/[filename])`

Result:

- Saved file: `./2026-07-13-22-15-30.png`
- Inserted text: `[description](./2026-07-13-22-15-30.png)`
- The `description` text is selected for editing

### HTML example

Default settings:

- `dirname`: `.`
- `filename`: `[YYYY-MM-DD-HH-mm-ss]`
- `template`: `<a href="[dirname]/[filename]">[altText]</a>`

Result:

- Inserted text: `<a href="./2026-07-13-22-15-30.png">description</a>`
- The `description` link text is selected for editing

## How it works

```text
Clipboard
   │
   ├─ empty text ──────────────► platform shell script ─► save image ─► insert template
   ├─ http(s) URL ─────────────► download with limits ──► save file ───► insert template
   └─ text
        ├─ existing file path ─► copy file ─────────────► insert template
        ├─ image data URL/SVG ─► decode and save ───────► insert template
        └─ otherwise ───────────► save plain text ──────► insert template
```

The save directory comes from the active document. Relative `dirname` values are resolved from the current file's folder. Untitled files use the first workspace folder.

After insert, the extension tries to select the generated alt or link text so you can edit it immediately.

## Configuration

Settings namespace: `clipboardFilePaste`

Manifest entries (`commands`, `keybindings`, `menus`, `configuration`) are defined in `package.json` under `contributes`.

### `clipboardFilePaste.templates`

Map VS Code `languageId` values to paste settings.

Default:

```json
{
  "markdown": {
    "dirname": ".",
    "filename": "[YYYY-MM-DD-HH-mm-ss]",
    "altText": "description",
    "template": "[[altText]]([dirname]/[filename])"
  },
  "html": {
    "dirname": ".",
    "filename": "[YYYY-MM-DD-HH-mm-ss]",
    "altText": "description",
    "template": "<a href=\"[dirname]/[filename]\">[altText]</a>"
  }
}
```

| Field | Purpose |
|-------|---------|
| `dirname` | Relative save directory (supports date and RID placeholders) |
| `filename` | File name pattern (supports date and RID placeholders) |
| `altText` | Default alt or link text inserted into the template |
| `template` | Reference inserted at the cursor |

Notes:

- `template` uses `[dirname]`, `[filename]`, and `[altText]`
- Markdown templates may also use the literal `![altText]` token for image syntax
- Templates are matched by `languageId` such as `markdown` or `html`
- Unsupported languages fall back to the `markdown` template
- `dirname` must not contain `..`

### `clipboardFilePaste.defaultTextExtension`

Extension used when pasting plain text from the clipboard. Default: `txt`.

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `[YYYY-MM-DD]` | Date format via dayjs | `2026-07-13` |
| `[YYYY-MM-DD-HH-mm-ss]` | Date-time format | `2026-07-13-22-15-30` |
| `[RID-N]` | Random `0-9A-Za-z` string, length `N` | `[RID-4]` |
| `[dirname]` | Resolved save directory in `template` | `.` |
| `[filename]` | Resolved file name in `template` | `2026-07-13.png` |
| `[altText]` | Resolved alt or link text in `template` | `description` |

Rules:

- Date and RID placeholders must be wrapped in `[]`
- Identical placeholders in one paste resolve to the same value
- If the resolved filename has no extension, the clipboard file extension is appended
- Relative paths are resolved from the current file directory
- Absolute paths and `file://` URLs are supported

## Clipboard sources

| Source | Behavior |
|--------|----------|
| Empty clipboard text | Treated as a clipboard image; uses a platform shell script |
| File path in clipboard | Copies an existing file and preserves its extension |
| HTTP(S) URL | Downloads the response with timeout and size limits; uses URL path or `Content-Type` for the extension |
| Image data URL or raw SVG | Saves with the derived image extension |
| Plain text | Saves as UTF-8 using `defaultTextExtension`; leading and trailing whitespace are preserved |

## Filename collisions

If `./2026-07-13.png` already exists, the extension tries:

- `./2026-07-13-1.png`
- `./2026-07-13-2.png`
- ...

The attempt stops after 100 candidates.

## Platform notes

- Windows uses PowerShell to read clipboard images and saves them as PNG
- macOS supports PNG, JPEG, and GIF clipboard images through AppleScript
- Linux requires `xclip` and tries PNG, JPEG, GIF, and WebP clipboard targets
- File operations use `vscode.workspace.fs`, including the final save after clipboard image capture
- Clipboard shell scripts only write to a temp file; the extension copies that data into the workspace through `workspace.fs`

## Known limitations

1. Windows clipboard images are normalized to PNG
2. Linux clipboard image support depends on `xclip` and the image formats exposed by the desktop environment
3. Untitled files require an open workspace so the save location can be resolved
4. Non-image binary clipboard content is not supported outside file-path text
5. HTTP downloads are limited to 30 seconds and 50 MB

## Source layout

| Path | Responsibility |
|------|----------------|
| `src/extension.ts` | Command registration and activation |
| `src/core/paste.ts` | Main paste workflow and clipboard routing |
| `src/core/utils.ts` | Path, placeholder, and clipboard text parsing helpers |
| `src/core/collision.ts` | `-1`, `-2`, ... filename collision handling |
| `src/core/templateConfig.ts` | Settings validation for language templates |
| `src/core/altTextSelection.ts` | Post-insert alt/link text selection |
| `src/core/workspaceFs.ts` | `vscode.workspace.fs` wrappers |
| `src/core/httpDownload.ts` | HTTP(S) download with size and timeout limits |
| `src/core/constant.ts` | Shared command and settings identifiers |
| `res/` | Platform shell scripts for reading clipboard images |

## Development

```bash
pnpm --filter vscode-clipboard-file-paste install
pnpm --filter vscode-clipboard-file-paste compile
pnpm --filter vscode-clipboard-file-paste test
pnpm --filter vscode-clipboard-file-paste package
```

- `compile` bundles `src/extension.ts` to `dist/extension.js`
- `test` runs Vitest unit tests under `__tests__/`
- `package` builds the extension and produces a `.vsix` file

Press `F5` in this package folder to launch an Extension Development Host. The launch configuration runs `compile` first.

When changing commands, keybindings, menus, or settings, edit `contributes` in `package.json` directly.
