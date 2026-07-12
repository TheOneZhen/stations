import { describe, expect, it, vi } from 'vitest'
import { readClipboard } from '../src/clipboard/readClipboard'
import type { ClipboardBridge } from '../src/clipboard/webviewBridge'
import * as vscode from 'vscode'

vi.mock('vscode', () => ({
  env: {
    clipboard: {
      readText: vi.fn(),
    },
  },
  workspace: {
    fs: {
      readFile: vi.fn(),
      stat: vi.fn(),
    },
  },
  FileType: {
    File: 1,
  },
  Uri: {
    file: (value: string) => ({ fsPath: value }),
  },
}))

vi.mock('../src/clipboard/webviewBridge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/clipboard/webviewBridge')>()
  return {
    ...actual,
    readFileFromClipboardText: vi.fn(),
    readImageFromPowerShell: vi.fn(),
  }
})

import {
  readFileFromClipboardText,
  readImageFromPowerShell,
} from '../src/clipboard/webviewBridge'

const bridge: ClipboardBridge = {
  readImage: vi.fn(),
  dispose: vi.fn(),
}

describe('readClipboard', () => {
  it('returns file-path clipboard data when a file path is available', async () => {
    vi.mocked(readFileFromClipboardText).mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'application/pdf',
      fileName: 'document.pdf',
    })
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('C:\\files\\document.pdf')

    const result = await readClipboard(bridge, 'txt')

    expect(result).toEqual({
      bytes: new Uint8Array([1, 2, 3]),
      extension: 'pdf',
      originalFileName: 'document.pdf',
      mimeType: 'application/pdf',
      source: 'file-path',
    })
  })

  it('returns plain text clipboard data when text is not a file path', async () => {
    vi.mocked(readFileFromClipboardText).mockResolvedValue(undefined)
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('hello world')

    const result = await readClipboard(bridge, 'txt')

    expect(result).toEqual({
      bytes: new TextEncoder().encode('hello world'),
      extension: 'txt',
      source: 'text',
    })
  })

  it('falls back to image clipboard data when text is empty', async () => {
    vi.mocked(readFileFromClipboardText).mockResolvedValue(undefined)
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('')
    vi.mocked(readImageFromPowerShell).mockResolvedValue({
      bytes: new Uint8Array([9, 9, 9]),
      mimeType: 'image/png',
    })

    const result = await readClipboard(bridge, 'txt')

    expect(result).toEqual({
      bytes: new Uint8Array([9, 9, 9]),
      extension: 'png',
      mimeType: 'image/png',
      source: 'image',
    })
  })
})
