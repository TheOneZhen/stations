import * as path from 'node:path'
import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { resolveAvailablePath } from '../src/path/collision'
import { resolveLanguageTemplate } from '../src/template/templateEngine'

describe('resolveAvailablePath', () => {
  it('returns first available candidate', async () => {
    const existing = new Set(['/tmp/a.png', '/tmp/a-1.png'])
    const result = await resolveAvailablePath('/tmp/a.png', async (candidate) =>
      existing.has(candidate),
    )
    expect(result).toBe('/tmp/a-2.png')
  })
})

describe('resolveLanguageTemplate', () => {
  it('resolves markdown template to save path and insert text', async () => {
    const documentDir = path.join('/project', 'docs')
    const result = await resolveLanguageTemplate({
      languageTemplate: {
        dirname: './images/',
        filename: '[YYYY-MM-DD]',
        template: '![altText]([dirname]/[filename])',
      },
      languageId: 'markdown',
      documentDir,
      fileExtension: 'png',
      placeholderContext: {
        now: dayjs('2026-07-09T10:00:00'),
        random: () => 0,
      },
      pathExists: async () => false,
    })

    expect(result.absoluteSavePath).toBe(
      path.join(documentDir, 'images', '2026-07-09.png'),
    )
    expect(result.referencePath).toBe('./images/2026-07-09.png')
    expect(result.insertText).toBe('![altText](./images/2026-07-09.png)')
  })

  it('uses collision suffix when target file exists', async () => {
    const documentDir = path.join('/project', 'docs')
    const existingPath = path.join(documentDir, 'images', '2026-07-09.png')
    const result = await resolveLanguageTemplate({
      languageTemplate: {
        dirname: './images/',
        filename: '[YYYY-MM-DD]',
        template: '![altText]([dirname]/[filename])',
      },
      languageId: 'markdown',
      documentDir,
      fileExtension: 'png',
      placeholderContext: {
        now: dayjs('2026-07-09T10:00:00'),
        random: () => 0,
      },
      pathExists: async (candidate) => candidate === existingPath,
    })

    expect(result.absoluteSavePath).toBe(
      path.join(documentDir, 'images', '2026-07-09-1.png'),
    )
    expect(result.insertText).toBe('![altText](./images/2026-07-09-1.png)')
  })

  it('preserves configured file extension for non-image files', async () => {
    const documentDir = path.join('/project', 'docs')
    const result = await resolveLanguageTemplate({
      languageTemplate: {
        dirname: './files/',
        filename: '[YYYY-MM-DD]',
        template: '[dirname]/[filename]',
      },
      languageId: 'markdown',
      documentDir,
      fileExtension: 'pdf',
      placeholderContext: {
        now: dayjs('2026-07-09T10:00:00'),
        random: () => 0,
      },
      pathExists: async () => false,
    })

    expect(result.absoluteSavePath).toBe(
      path.join(documentDir, 'files', '2026-07-09.pdf'),
    )
    expect(result.insertText).toBe('./files/2026-07-09.pdf')
  })
})
