import { Buffer } from 'node:buffer'

export const DEFAULT_HTTP_TIMEOUT_MS = 30_000
export const DEFAULT_HTTP_MAX_BYTES = 50 * 1024 * 1024

export interface DownloadedResource {
  buffer: Buffer
  contentType: string | null
}

/**
 * Download a clipboard HTTP(S) URL with timeout and size limits.
 *
 * Streams the response when possible so oversized payloads are rejected
 * before the full body is buffered.
 */
export async function downloadUrl(
  url: string,
  options: {
    timeoutMs?: number
    maxBytes?: number
  } = {},
): Promise<DownloadedResource> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_HTTP_MAX_BYTES
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > maxBytes) {
    throw new Error(`Download exceeds maximum size of ${maxBytes} bytes`)
  }

  if (!response.body) {
    const data = await response.arrayBuffer()
    if (data.byteLength > maxBytes) {
      throw new Error(`Download exceeds maximum size of ${maxBytes} bytes`)
    }
    return {
      buffer: Buffer.from(data),
      contentType: response.headers.get('content-type'),
    }
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      throw new Error(`Download exceeds maximum size of ${maxBytes} bytes`)
    }

    chunks.push(value)
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: response.headers.get('content-type'),
  }
}
