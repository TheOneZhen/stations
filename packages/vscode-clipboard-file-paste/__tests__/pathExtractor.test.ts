import { describe, expect, it } from 'vitest'
import {
  buildInsertText,
  PathExtractionError,
  validateLanguageTemplate,
} from '../src/template/pathExtractor'

describe('buildInsertText', () => {
  it('replaces dirname and filename placeholders', () => {
    expect(
      buildInsertText(
        '![altText]([dirname]/[filename])',
        './images/',
        '2026-07-09.png',
      ),
    ).toBe('![altText](./images/2026-07-09.png)')
  })

  it('replaces html template placeholders', () => {
    expect(
      buildInsertText(
        '<img alt="altText" src="[dirname]/[filename]" />',
        './images/',
        '2026-07-09.png',
      ),
    ).toBe('<img alt="altText" src="./images/2026-07-09.png" />')
  })
})

describe('validateLanguageTemplate', () => {
  it('throws when required fields are missing', () => {
    expect(() =>
      validateLanguageTemplate({ dirname: './images/' }, 'markdown'),
    ).toThrow(PathExtractionError)
  })
})
