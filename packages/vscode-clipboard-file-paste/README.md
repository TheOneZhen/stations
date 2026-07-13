# Clipboard File Paste

Paste clipboard content into your workspace, save it next to the current file, and insert a language-specific reference at the cursor.

## Features

- Save clipboard content (file paths, HTTP URLs, images, data URLs, plain text) beside the active document
- Insert language-specific references through configurable templates
- Dynamic path placeholders such as `[YYYY-MM-DD]`, `[YYYY-MM-DD-HH-mm-ss]`, and `[RID-4]`
- Template placeholders: `[dirname]`, `[filename]`, `[altText]`
- Select the generated alt/link text after insert when the template supports it
- Filename collision handling with `-1`, `-2`, and so on
- Shortcut: `Ctrl+Alt+V` (`Cmd+Alt+V` on macOS)
- Editor context menu entry

## Usage

1. Copy content to the clipboard.
2. Open a supported file in the editor.
3. Press `Ctrl+Alt+V` or run **Paste Clipboard File** from the context menu.
4. The file is saved and a reference is inserted at the cursor.

Example for Markdown with the default settings:

- Config:
  - `dirname`: `.`
  - `filename`: `[YYYY-MM-DD-HH-mm-ss]`
  - `template`: `[[altText]]([dirname]/[filename])`
- Saved file: `./2026-07-13-22-15-30.png`
- Inserted text: `[description](./2026-07-13-22-15-30.png)`
- The `description` text is selected for editing

Example for HTML with the default settings:

- Config:
  - `dirname`: `.`
  - `filename`: `[YYYY-MM-DD-HH-mm-ss]`
  - `template`: `<a href="[dirname]/[filename]">[altText]</a>`
- Inserted text: `<a href="./2026-07-13-22-15-30.png">description</a>`
- The `description` link text is selected for editing

## Configuration

Settings namespace: `clipboardFilePaste`

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

Notes:

- `dirname` and `filename` support date and RID placeholders
- `template` uses `[dirname]`, `[filename]`, and `[altText]`
- Markdown templates may also use the literal `altText` token in `![altText](...)`
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
| File path in clipboard | Copies an existing file and preserves its extension |
| HTTP(S) URL | Downloads the response with timeout and size limits; uses URL path or `Content-Type` for the extension |
| Image data URL or raw SVG | Saves with the derived image extension |
| Plain text | Saves as UTF-8 using `defaultTextExtension`; leading and trailing whitespace are preserved |
| Image binary | Uses a platform shell script and saves as PNG |

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

## Development

```bash
pnpm --filter vscode-clipboard-file-paste install
pnpm --filter vscode-clipboard-file-paste compile
pnpm --filter vscode-clipboard-file-paste test
```

`compile` bundles the extension and syncs `contributes` from `src/core/constant.ts` into `package.json`. Run compile before `F5` debugging or packaging so commands, keybindings, and settings are registered.

Press `F5` in this package folder to launch an Extension Development Host.

## Clipboard reading strategy

1. Clipboard text that points to an existing file path
2. Clipboard plain text saved as a text file
3. Clipboard image binary read through a platform shell script into a temp file, then saved through `workspace.fs` when clipboard text is empty

This works around VS Code's text-only clipboard API while keeping file writes on the workspace file system.
