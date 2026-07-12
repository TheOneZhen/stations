export const extensionName = 'Clipboard File Paste'
export const commandPrefix = 'clipboardFilePaste'
export const pasteCommand = `${commandPrefix}.paste`
export const pasteCommandTitle = 'Paste Clipboard File'
export const pasteCommandTemplates = `${commandPrefix}.templates`

/* Extension contributes. It will be built and move in dist package.json */
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
          /// TODO: file type support regular expression
          markdown: {
            dirname: '.', // default directory
            filename: '[YYYY-MM-DD-HH-mm-ss]', // default filename
            altText: 'description', // default alt text
            template: '![altText]([dirname]/[filename])', // default template
          },
          html: {
            dirname: '.',
            filename: '[YYYY-MM-DD-HH-mm-ss]',
            altText: 'description',
            template: '<img alt="[altText]" src="[dirname]/[filename]" />',
          },
        },
      },
      [`${commandPrefix}.defaultTextExtension`]: {
        type: 'string',
        default: 'txt',
        description: 'File extension (without dot) used when pasting plain text from the clipboard.',
      },
    },
  },
}
