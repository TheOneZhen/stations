import type { LanguageTemplate } from './types'

export class TemplateConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TemplateConfigError'
  }
}

export function validateLanguageTemplate(value: unknown, languageId: string): LanguageTemplate {
  if (!value || typeof value !== 'object') {
    throw new TemplateConfigError(`Invalid template config for language "${languageId}"`)
  }

  const template = value as Partial<LanguageTemplate>

  if (typeof template.dirname !== 'string' || !template.dirname.trim()) {
    throw new TemplateConfigError(`Missing dirname for language "${languageId}"`)
  }

  if (typeof template.filename !== 'string' || !template.filename.trim()) {
    throw new TemplateConfigError(`Missing filename for language "${languageId}"`)
  }

  if (typeof template.template !== 'string' || !template.template.trim()) {
    throw new TemplateConfigError(`Missing template for language "${languageId}"`)
  }

  if (template.altText !== undefined && typeof template.altText !== 'string') {
    throw new TemplateConfigError(`Invalid altText for language "${languageId}"`)
  }

  return {
    dirname: template.dirname,
    filename: template.filename,
    template: template.template,
    altText: template.altText ?? 'description',
  }
}
