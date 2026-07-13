import { Buffer } from 'node:buffer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dayjs from 'dayjs'
import sanitize from 'sanitize-filename'

export function isHttpURL(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

export function isLocalFilePath(path: string): boolean {
  return path.startsWith('/') || path.startsWith('~') || path.startsWith('.')
}
// replace the placeholder with the random id or the formatted time
export function parseReplacer(str: string) {
  const matched = str.matchAll(/(\[RID-(\d+)\])/gi)
  // first try to match the random id, if not, then match the time format
  if (matched) {
    for (const match of matched) {
      const num = Number(match[2])
      if (match[1] && Number.isInteger(num) && num > 0) {
        const randomId = genRandomId(num)
        str = str.replace(match[0], randomId)
      }
    }
    return str
  }
  else {
    // i can't believe this is working😂
    return dayjs().format(dayjs().format(str))
  }
}
/* sanitize the full path, invalid characters will be replaced with `_` */
export function sanitizeFullPath(fullPath: string) {
  return fullPath
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => {
      if (segment === '' || segment === '.' || segment === '..') {
        return segment
      }
      return sanitize(segment, { replacement: '_' })
    })
    .join('/')
}
/* generate random id with the length of 6 */
function genRandomId(length: number = 6) {
  return Math.random().toString(36).substring(2, 2 + length)
}
function extensionFromPathname(pathname: string): string {
  return path.extname(pathname).slice(1)
}

/* get file extension from relative path, file:// URL, or http(s) URL */
export function getFileExtension(filePath: string): string {
  if (isHttpURL(filePath)) {
    try {
      return extensionFromPathname(new URL(filePath).pathname)
    }
    catch {
      return ''
    }
  }

  if (filePath.startsWith('file://')) {
    try {
      return extensionFromPathname(fileURLToPath(filePath))
    }
    catch {
      return ''
    }
  }

  return extensionFromPathname(filePath)
}

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
}

const DATA_URL_PATTERN = /^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/s

export interface ParsedImageDataUrl {
  mimeType: string
  extension: string
  buffer: Buffer
}

/** Returns true when `text` is a data URL with an image MIME type. */
export function isImageDataUrl(text: string): boolean {
  return text.startsWith('data:image/')
}

function extensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase()
  if (MIME_TO_EXTENSION[normalized]) {
    return MIME_TO_EXTENSION[normalized]
  }
  const subtype = normalized.split('/')[1] ?? ''
  return subtype.replace(/^x-/, '').replace(/\+xml$/, '')
}

/** Parse an image data URL into a buffer and file extension. Returns null for non-image or invalid input. */
export function parseImageDataUrl(text: string): ParsedImageDataUrl | null {
  if (!isImageDataUrl(text)) {
    return null
  }

  const match = text.match(DATA_URL_PATTERN)
  if (!match) {
    return null
  }

  const mimeType = (match[1] ?? '').toLowerCase()
  if (!mimeType.startsWith('image/')) {
    return null
  }

  const isBase64 = Boolean(match[2])
  const payload = match[3] ?? ''

  try {
    const buffer = isBase64
      ? Buffer.from(payload, 'base64')
      : Buffer.from(decodeURIComponent(payload), 'utf8')

    if (buffer.length === 0) {
      return null
    }

    return {
      mimeType,
      extension: extensionFromMimeType(mimeType),
      buffer,
    }
  }
  catch {
    return null
  }
}

/** Returns true when `text` is raw SVG markup (not a data URL). */
export function isRawSvg(text: string): boolean {
  const trimmed = text.trim()
  if (/^<svg[\s>]/i.test(trimmed)) {
    return true
  }
  if (trimmed.startsWith('<?xml') && /<svg[\s>]/i.test(trimmed)) {
    return true
  }
  return false
}

/** Parse raw SVG markup into a buffer. Returns null when the text is not SVG. */
export function parseRawSvg(text: string): ParsedImageDataUrl | null {
  if (!isRawSvg(text)) {
    return null
  }

  return {
    mimeType: 'image/svg+xml',
    extension: 'svg',
    buffer: Buffer.from(text, 'utf8'),
  }
}
