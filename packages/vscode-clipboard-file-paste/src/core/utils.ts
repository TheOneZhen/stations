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