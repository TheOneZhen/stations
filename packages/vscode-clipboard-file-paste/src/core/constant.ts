export const extensionName = 'Clipboard File Paste'
export const commandPrefix = 'clipboardFilePaste'
export const pasteCommand = `${commandPrefix}.paste`
export const pasteCommandTitle = 'Paste Clipboard File'
export const pasteCommandTemplates = `${commandPrefix}.templates`

/* Extension manifest (commands, keybindings, configuration). Synced into package.json on compile. */
export const contributes = {
  /* Extension commands */
  commands: [
    {
      command: pasteCommand,
      title: pasteCommandTitle,
      category: extensionName,
    },
  ],
  /* Editor keybindings */
  keybindings: [
    {
      command: pasteCommand,
      key: 'ctrl+alt+v',
      mac: 'cmd+alt+v',
      when: 'editorTextFocus',
    },
  ],
  /* Editor context menu */
  menus: {
    'editor/context': [
      {
        command: pasteCommand,
        group: '1_modification@100',
        when: 'editorTextFocus',
      },
    ],
  },
  /* Extension configuration */
  configuration: {
    title: extensionName,
    properties: {
      [pasteCommandTemplates]: {
        type: 'object',
        default: {
          markdown: {
            dirname: '.',
            filename: '[YYYY-MM-DD-HH-mm-ss]',
            altText: 'description',
            template: '[[altText]]([dirname]/[filename])',
          },
          html: {
            dirname: '.',
            filename: '[YYYY-MM-DD-HH-mm-ss]',
            altText: 'description',
            template: '<a href="[dirname]/[filename]">[altText]</a>',
          },
        },
        markdownDescription: 'Map VS Code `languageId` to paste settings. `dirname` and `filename` support date/RID placeholders. `template` uses `[dirname]`, `[filename]`, and `[altText]` for the inserted reference.',
      },
      [`${commandPrefix}.defaultTextExtension`]: {
        type: 'string',
        default: 'txt',
        description: 'File extension (without dot) used when pasting plain text from the clipboard.',
      },
    },
  },
}
