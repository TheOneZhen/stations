import { describe, expect, it } from 'vitest'
import { isImageDataUrl, isRawSvg, parseImageDataUrl, parseRawSvg } from '../src/core/utils'

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
const SVG_XML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
const SVG_BASE64 = Buffer.from(SVG_XML, 'utf8').toString('base64')

describe('isImageDataUrl', () => {
  it('returns true for image data URLs', () => {
    expect(isImageDataUrl(`data:image/png;base64,${PNG_BASE64}`)).toBe(true)
  })

  it('returns false for non-image data URLs', () => {
    expect(isImageDataUrl('data:text/plain,hello')).toBe(false)
  })
})

describe('parseImageDataUrl', () => {
  it('parses a base64 PNG data URL', () => {
    const result = parseImageDataUrl(`data:image/png;base64,${PNG_BASE64}`)

    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe('image/png')
    expect(result?.extension).toBe('png')
    expect(result?.buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  })

  it('parses a URL-encoded SVG data URL', () => {
    const result = parseImageDataUrl(`data:image/svg+xml,${encodeURIComponent(SVG_XML)}`)

    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe('image/svg+xml')
    expect(result?.extension).toBe('svg')
    expect(result?.buffer.toString('utf8')).toBe(SVG_XML)
  })

  it('parses a base64 SVG data URL', () => {
    const result = parseImageDataUrl(`data:image/svg+xml;base64,${SVG_BASE64}`)

    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe('image/svg+xml')
    expect(result?.extension).toBe('svg')
    expect(result?.buffer.toString('utf8')).toBe(SVG_XML)
  })

  it('returns null for non-image data URLs', () => {
    expect(parseImageDataUrl('data:text/plain,hello')).toBeNull()
  })

  it('returns null for invalid strings', () => {
    expect(parseImageDataUrl('not-a-data-url')).toBeNull()
    expect(parseImageDataUrl('data:image/png;base64,')).toBeNull()
  })
})

describe('isRawSvg', () => {
  it('returns true for raw svg markup', () => {
    expect(isRawSvg(SVG_XML)).toBe(true)
    expect(isRawSvg(`<?xml version="1.0"?>\n${SVG_XML}`)).toBe(true)
  })

  it('returns false for non-svg text', () => {
    expect(isRawSvg('hello world')).toBe(false)
    expect(isRawSvg('<?xml version="1.0"?><html></html>')).toBe(false)
  })
})

describe('parseRawSvg', () => {
  it('parses raw svg markup', () => {
    const result = parseRawSvg(SVG_XML)

    expect(result).not.toBeNull()
    expect(result?.mimeType).toBe('image/svg+xml')
    expect(result?.extension).toBe('svg')
    expect(result?.buffer.toString('utf8')).toBe(SVG_XML)
  })

  it('parses svg with xml declaration', () => {
    const svgWithDeclaration = `<?xml version="1.0" encoding="UTF-8"?>\n${SVG_XML}`
    const result = parseRawSvg(svgWithDeclaration)

    expect(result).not.toBeNull()
    expect(result?.extension).toBe('svg')
    expect(result?.buffer.toString('utf8')).toBe(svgWithDeclaration)
  })

  it('returns null for non-svg text', () => {
    expect(parseRawSvg('not svg')).toBeNull()
  })
})
