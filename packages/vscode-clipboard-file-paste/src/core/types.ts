/** Per-language paste settings from `clipboardFilePaste.templates`. */
export interface LanguageTemplate {
  /** Relative directory under the active file (supports date/RID placeholders). */
  dirname: string
  /** File name pattern (supports date/RID placeholders). */
  filename: string
  /** Default alt or link text inserted into the template. */
  altText?: string
  /** Inserted reference; uses `[dirname]`, `[filename]`, and `[altText]`. */
  template: string
}

/** Resolved paths and text produced before the clipboard payload is written. */
export interface PasteContext {
  /** Absolute target path before collision resolution. */
  filePath: string
  /** Normalized relative directory used in the template. */
  dirname: string
  /** Sanitized file name (may differ from the saved name after collision handling). */
  filename: string
  /** Resolved alt or link text. */
  altText: string
  /** Fully expanded template string for the initial save path. */
  template: string
  /** Raw language template from settings. */
  languageTemplate: LanguageTemplate
}
