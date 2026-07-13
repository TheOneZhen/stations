import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as vscode from 'vscode'
import { Paster } from '../src/core/paste'

const { createWorkspaceFs, FileType } = vi.hoisted(() => {
  const FileType = {
    File: 1,
    Directory: 2,
  }

  return {
    FileType,
    createWorkspaceFs: () => ({
      stat: async (uri: { fsPath: string }) => {
        const stat = fs.statSync(uri.fsPath)
        return {
          type: stat.isDirectory() ? FileType.Directory : FileType.File,
          size: stat.size,
        }
      },
      writeFile: async (uri: { fsPath: string }, data: Uint8Array) => {
        fs.mkdirSync(path.dirname(uri.fsPath), { recursive: true })
        fs.writeFileSync(uri.fsPath, Buffer.from(data))
      },
      readFile: async (uri: { fsPath: string }) => fs.readFileSync(uri.fsPath),
      createDirectory: async (uri: { fsPath: string }) => {
        fs.mkdirSync(uri.fsPath, { recursive: true })
      },
      delete: async (uri: { fsPath: string }) => {
        fs.rmSync(uri.fsPath, { force: true })
      },
    }),
  }
})

vi.mock('vscode', () => ({
  env: {
    clipboard: {
      readText: vi.fn(),
    },
  },
  window: {
    activeTextEditor: undefined,
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
    })),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
    getConfiguration: vi.fn(),
    fs: createWorkspaceFs(),
  },
  FileType,
  Uri: {
    file: (value: string) => ({ fsPath: value }),
  },
  Selection: class Selection {
    anchor
    active
    constructor(anchor: unknown, active?: unknown) {
      this.anchor = anchor
      this.active = active ?? anchor
    }
  },
}))

function createEditor(languageId = 'markdown', fileName = '/workspace/docs/readme.md') {
  return {
    document: {
      uri: { scheme: 'file', fsPath: fileName },
      fileName,
      languageId,
    },
    selection: {
      start: { line: 0, character: 0, translate: (line: number, char: number) => ({ line, character: char }) },
      end: { line: 0, character: 0 },
    },
    edit: vi.fn(async (callback: (builder: { replace: ReturnType<typeof vi.fn> }) => void) => {
      callback({ replace: vi.fn() })
      return true
    }),
  } as unknown as vscode.TextEditor
}

function mockConfiguration(languageId = 'markdown') {
  const templates = {
    markdown: {
      dirname: '.',
      filename: 'photo',
      altText: 'description',
      template: '![altText]([dirname]/[filename])',
    },
    html: {
      dirname: '.',
      filename: 'photo',
      altText: 'description',
      template: '<a href="[dirname]/[filename]">[altText]</a>',
    },
  }

  vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
    get: vi.fn((key: string) => {
      if (key === 'templates') {
        return templates
      }
      if (key === 'defaultTextExtension') {
        return 'txt'
      }
      return undefined
    }),
  } as unknown as vscode.WorkspaceConfiguration)

  return templates[languageId as keyof typeof templates]
}

describe('Paster.getPasteInfo', () => {
  const paster = new Paster()

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfiguration()
  })

  it('resolves markdown template paths and insert text', () => {
    const editor = createEditor()
    const result = paster.getPasteInfo(editor, 'png')

    expect(result.filePath).toBe(
      path.resolve('/workspace/docs', 'photo.png'),
    )
    expect(result.template).toBe('![description](./photo.png)')
  })

  it('falls back to markdown template for unsupported languages', () => {
    const editor = createEditor('typescript')
    const result = paster.getPasteInfo(editor, 'png')

    expect(result.template).toContain('![description](')
  })

  it('uses defaultTextExtension for plain text saves', () => {
    const editor = createEditor()
    const result = paster.getPasteInfo(editor, 'txt')

    expect(result.filePath.endsWith('.txt')).toBe(true)
  })

  it('rejects dirname values that escape with ..', () => {
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'templates') {
          return {
            markdown: {
              dirname: '..',
              filename: 'photo',
              template: '![altText]([dirname]/[filename])',
            },
          }
        }
        return 'txt'
      }),
    } as unknown as vscode.WorkspaceConfiguration)

    const editor = createEditor()
    expect(() => paster.getPasteInfo(editor, 'png')).toThrow('dirname must not contain ".."')
  })
})

describe('Paster.schedule', () => {
  const paster = new Paster()
  let tempDir = ''

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paste-test-'))
    mockConfiguration()
    vi.spyOn(paster, 'saveClipboardImageToTemp').mockResolvedValue('')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('saves plain text after a failed local path lookup', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('hello world')

    await paster.schedule(editor)

    expect(fs.existsSync(path.join(tempDir, 'photo.txt'))).toBe(true)
    expect(editor.edit).toHaveBeenCalled()
  })

  it('preserves leading and trailing whitespace in plain text', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('  hello  ')

    await paster.schedule(editor)

    expect(fs.readFileSync(path.join(tempDir, 'photo.txt'), 'utf8')).toBe('  hello  ')
  })

  it('does not insert a template when clipboard image save fails', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('')

    await paster.schedule(editor)

    expect(editor.edit).not.toHaveBeenCalled()
  })

  it('writes binary data without corrupting bytes', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00])
    const dataUrl = `data:image/png;base64,${pngBytes.toString('base64')}`

    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue(dataUrl)

    await paster.schedule(editor)

    const savedPath = path.join(tempDir, 'photo.png')
    const savedBytes = fs.readFileSync(savedPath)

    expect(Array.from(savedBytes.slice(0, 8))).toEqual(Array.from(pngBytes.slice(0, 8)))
  })

  it('uses collision suffix when target file already exists', async () => {
    fs.writeFileSync(path.join(tempDir, 'photo.png'), 'existing')

    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47])
    const dataUrl = `data:image/png;base64,${pngBytes.toString('base64')}`

    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue(dataUrl)

    await paster.schedule(editor)

    expect(fs.existsSync(path.join(tempDir, 'photo-1.png'))).toBe(true)
  })

  it('selects alt text after inserting markdown template', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('plain text')

    await paster.schedule(editor)

    expect(editor.selection).toEqual(
      expect.objectContaining({
        anchor: { line: 0, character: 2 },
        active: { line: 0, character: 13 },
      }),
    )
  })
})

describe('Paster.writeBuffer', () => {
  const paster = new Paster()
  let tempDir = ''

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paste-write-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates parent directories before writing', async () => {
    const targetPath = path.join(tempDir, 'nested', 'dir', 'file.bin')
    const data = Buffer.from([1, 2, 3, 4])

    const savedPath = await paster.writeBuffer(targetPath, data)

    expect(savedPath).toBe(targetPath)
    expect(fs.readFileSync(targetPath)).toEqual(data)
  })
})

describe('Paster HTTP handling', () => {
  const paster = new Paster()
  let tempDir = ''

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paste-http-'))
    mockConfiguration()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    vi.unstubAllGlobals()
  })

  it('does not insert a template when HTTP download fails', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('https://example.com/missing.png')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => null },
      body: null,
    }))

    await paster.schedule(editor)

    expect(editor.edit).not.toHaveBeenCalled()
  })

  it('uses Content-Type when the URL has no extension', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47])
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('https://example.com/image')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (name: string) => name === 'content-type' ? 'image/png' : null,
      },
      body: null,
      arrayBuffer: async () => pngBytes.buffer.slice(
        pngBytes.byteOffset,
        pngBytes.byteOffset + pngBytes.byteLength,
      ),
    }))

    await paster.schedule(editor)

    expect(fs.existsSync(path.join(tempDir, 'photo.png'))).toBe(true)
  })
})

describe('Paster local file copy', () => {
  const paster = new Paster()
  let tempDir = ''

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paste-copy-'))
    mockConfiguration()
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('copies an existing local file from a relative path', async () => {
    const sourceDir = path.join(tempDir, 'assets')
    fs.mkdirSync(sourceDir, { recursive: true })
    const sourceFile = path.join(sourceDir, 'image.png')
    fs.writeFileSync(sourceFile, Buffer.from([0x89, 0x50, 0x4E, 0x47]))

    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('./assets/image.png')

    await paster.schedule(editor)

    expect(fs.existsSync(path.join(tempDir, 'photo.png'))).toBe(true)
    expect(editor.edit).toHaveBeenCalled()
  })
})
