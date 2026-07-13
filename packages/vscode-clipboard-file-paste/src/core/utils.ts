import { Buffer } from 'node:buffer'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import dayjs from 'dayjs'
import sanitize from 'sanitize-filename'

const RID_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const RESERVED_PLACEHOLDERS = new Set(['dirname', 'filename', 'altText'])

export interface ParseReplacerOptions {
  now?: dayjs.Dayjs
  random?: () => number
}

export function isHttpURL(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

export function isLocalFilePath(filePath: string): boolean {
  return filePath.startsWith('/') || filePath.startsWith('~') || filePath.startsWith('.')
}

export function looksLikeFilePath(text: string): boolean {
  if (text.startsWith('file://')) {
    return true
  }

  if (path.isAbsolute(text)) {
    return true
  }

  if (isLocalFilePath(text)) {
    return true
  }

  return /^[a-zA-Z]:[\\/]/.test(text)
}

/** Resolve a clipboard file path relative to the current editor directory. */
export function resolveLocalFilePath(text: string, baseDir: string): string {
  if (text.startsWith('file://')) {
    const fileUrl = new URL(text)

    try {
      return fileURLToPath(fileUrl)
    }
    catch {
      const decoded = decodeURIComponent(fileUrl.pathname)
      if (/^\/[a-zA-Z]:/.test(decoded)) {
        return decoded.slice(1)
      }
      return path.normalize(decoded)
    }
  }

  if (text.startsWith('~')) {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? ''
    const relative = text.slice(1).replace(/^[/\\]/, '')
    return path.resolve(home, relative)
  }

  if (path.isAbsolute(text) || /^[a-zA-Z]:[\\/]/.test(text)) {
    return path.normalize(text)
  }

  return path.resolve(baseDir, text)
}

export function ensureExtension(filename: string, extension: string): string {
  if (!extension || path.extname(filename)) {
    return filename
  }

  return `${filename}.${extension}`
}

export function replaceTemplatePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  const dirname = normalizeDirname(values.dirname ?? '')
  const filename = values.filename ?? ''
  const altText = values.altText ?? ''

  return template
    .replaceAll('[dirname]', dirname)
    .replaceAll('[filename]', filename)
    .replaceAll('![altText]', `![${altText}]`)
    .replaceAll('[altText]', altText)
}

export function normalizeDirname(dirname: string): string {
  return dirname.replace(/\\/g, '/').replace(/\/+$/, '')
}

export function generateRid(length: number, random: () => number = Math.random): string {
  let result = ''

  for (let index = 0; index < length; index++) {
    const charIndex = Math.floor(random() * RID_CHARSET.length)
    result += RID_CHARSET[charIndex]
  }

  return result
}

/** Replace date and RID placeholders in a configured path or filename string. */
export function parseReplacer(str: string, options: ParseReplacerOptions = {}): string {
  const now = options.now ?? dayjs()
  const random = options.random ?? Math.random
  const ridCache = new Map<string, string>()

  let result = str.replace(/\[RID-(\d+)\s*\]/gi, (match) => {
    const key = match.toLowerCase()

    if (!ridCache.has(key)) {
      const length = Number(match.match(/\d+/)?.[0] ?? 0)

      if (Number.isInteger(length) && length > 0) {
        ridCache.set(key, generateRid(length, random))
      }
    }

    return ridCache.get(key) ?? match
  })

  result = result.replace(/\[([^\]]+)\]/g, (match, token: string) => {
    if (/^RID-\d+\s*$/i.test(token) || RESERVED_PLACEHOLDERS.has(token)) {
      return match
    }

    try {
      const formatted = now.format(token)

      if (formatted && formatted !== token && !formatted.includes('Invalid')) {
        return formatted.replace(/ /g, '_')
      }
    }
    catch {
      return match
    }

    return match
  })

  return result
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
