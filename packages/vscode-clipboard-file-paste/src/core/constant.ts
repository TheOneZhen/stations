/** Human-readable extension name shown in VS Code UI. */
export const extensionName = 'Clipboard File Paste'

/** Settings namespace and command ID prefix (`clipboardFilePaste.*`). */
export const commandPrefix = 'clipboardFilePaste'

/** Command registered in `package.json` contributes and bound in `extension.ts`. */
export const pasteCommand = `${commandPrefix}.paste`
