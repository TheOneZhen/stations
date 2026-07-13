import path from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import {
  ensureExtension,
  looksLikeFilePath,
  replaceTemplatePlaceholders,
  resolveLocalFilePath,
  sanitizeFullPath,
} from '../src/core/utils'

describe('ensureExtension', () => {
  it('appends extension when missing', () => {
    expect(ensureExtension('2026-07-09', 'png')).toBe('2026-07-09.png')
  })

  it('keeps existing extension', () => {
    expect(ensureExtension('photo.webp', 'png')).toBe('photo.webp')
  })

  it('returns filename unchanged when extension is empty', () => {
    expect(ensureExtension('notes', '')).toBe('notes')
  })
})

describe('replaceTemplatePlaceholders', () => {
  it('replaces all placeholder occurrences', () => {
    expect(
      replaceTemplatePlaceholders(
        '![altText]([dirname]/[filename]) [dirname]/[filename]',
        {
          dirname: './images/',
          filename: '2026-07-09.png',
          altText: 'description',
        },
      ),
    ).toBe('![description](./images/2026-07-09.png) ./images/2026-07-09.png')
  })
})

describe('looksLikeFilePath', () => {
  it('detects absolute and relative paths', () => {
    expect(looksLikeFilePath('/tmp/a.png')).toBe(true)
    expect(looksLikeFilePath('./images/a.png')).toBe(true)
    expect(looksLikeFilePath('file:///tmp/a.png')).toBe(true)
    expect(looksLikeFilePath('C:\\images\\a.png')).toBe(true)
  })

  it('rejects plain text', () => {
    expect(looksLikeFilePath('hello world')).toBe(false)
    expect(looksLikeFilePath('data:image/png;base64,abc')).toBe(false)
  })
})

describe('resolveLocalFilePath', () => {
  it('resolves relative paths from the editor directory', () => {
    expect(resolveLocalFilePath('./images/a.png', '/project/docs')).toBe(
      path.resolve('/project/docs', './images/a.png'),
    )
  })

  it('resolves file URLs', () => {
    const fileUrl = process.platform === 'win32'
      ? 'file:///C:/tmp/a.png'
      : 'file:///tmp/a.png'

    expect(resolveLocalFilePath(fileUrl, '/project/docs')).toBe(
      path.normalize(process.platform === 'win32' ? 'C:\\tmp\\a.png' : '/tmp/a.png'),
    )
  })

  it('keeps absolute paths unchanged', () => {
    expect(resolveLocalFilePath('C:\\files\\a.png', '/project/docs')).toBe(
      path.normalize('C:\\files\\a.png'),
    )
  })
})

describe('sanitizeFullPath', () => {
  it('sanitizes invalid filename characters', () => {
    expect(sanitizeFullPath('./images/2026-07-09 18:26:33')).toBe(
      './images/2026-07-09 18_26_33',
    )
  })
})
