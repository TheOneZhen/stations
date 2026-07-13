import { describe, expect, it } from 'vitest'
import { TemplateConfigError, validateLanguageTemplate } from '../src/core/templateConfig'

describe('validateLanguageTemplate', () => {
  it('accepts a complete template config', () => {
    expect(
      validateLanguageTemplate({
        dirname: '.',
        filename: 'photo',
        altText: 'description',
        template: '![altText]([dirname]/[filename])',
      }, 'markdown'),
    ).toEqual({
      dirname: '.',
      filename: 'photo',
      altText: 'description',
      template: '![altText]([dirname]/[filename])',
    })
  })

  it('throws when required fields are missing', () => {
    expect(() =>
      validateLanguageTemplate({ dirname: '.' }, 'markdown'),
    ).toThrow(TemplateConfigError)
  })
})
