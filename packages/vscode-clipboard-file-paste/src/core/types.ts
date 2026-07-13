export interface LanguageTemplate {
  dirname: string
  filename: string
  altText?: string
  template: string
}

export interface PasteContext {
  filePath: string
  dirname: string
  filename: string
  altText: string
  template: string
  languageTemplate: LanguageTemplate
}
