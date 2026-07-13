import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as vscode from 'vscode'
import { Paster } from '../src/core/paste'

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
  },
}))

function createEditor(languageId = 'markdown', fileName = '/workspace/docs/readme.md') {
  return {
    document: {
      uri: { scheme: 'file' },
      fileName,
      languageId,
    },
    selection: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    edit: vi.fn(async (callback: (builder: { replace: ReturnType<typeof vi.fn> }) => void) => {
      callback({ replace: vi.fn() })
      return true
    }),
  } as unknown as vscode.TextEditor
}

function mockConfiguration(languageId = 'markdown') {
  const templates = {
    markdown: {
      dirname: './images/',
      filename: 'photo',
      altText: 'description',
      template: '![altText]([dirname]/[filename])',
    },
    html: {
      dirname: './images/',
      filename: 'photo',
      altText: 'description',
      template: '<img alt="[altText]" src="[dirname]/[filename]" />',
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
      path.resolve('/workspace/docs', 'images', 'photo.png'),
    )
    expect(result.template).toBe('![description](./images/photo.png)')
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
})

describe('Paster.schedule', () => {
  const paster = new Paster()
  let tempDir = ''

  beforeEach(() => {
    vi.clearAllMocks()
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paste-test-'))
    mockConfiguration()
    vi.spyOn(paster, 'saveClipboardImageToFile').mockResolvedValue('')
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('saves plain text after a failed local path lookup', async () => {
    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue('hello world')

    await paster.schedule(editor)

    const savedFiles = fs.readdirSync(path.join(tempDir, 'images'))
    expect(savedFiles.some(name => name.endsWith('.txt'))).toBe(true)
    expect(editor.edit).toHaveBeenCalled()
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

    const savedFiles = fs.readdirSync(path.join(tempDir, 'images'))
    const savedPath = path.join(tempDir, 'images', savedFiles[0]!)
    const savedBytes = fs.readFileSync(savedPath)

    expect(Array.from(savedBytes.slice(0, 8))).toEqual(Array.from(pngBytes.slice(0, 8)))
  })

  it('uses collision suffix when target file already exists', async () => {
    const imagesDir = path.join(tempDir, 'images')
    fs.mkdirSync(imagesDir, { recursive: true })
    fs.writeFileSync(path.join(imagesDir, 'photo.png'), 'existing')

    const editor = createEditor('markdown', path.join(tempDir, 'readme.md'))
    const pngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47])
    const dataUrl = `data:image/png;base64,${pngBytes.toString('base64')}`

    vi.mocked(vscode.env.clipboard.readText).mockResolvedValue(dataUrl)

    await paster.schedule(editor)

    expect(fs.existsSync(path.join(imagesDir, 'photo-1.png'))).toBe(true)
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
    }))

    await paster.schedule(editor)

    expect(editor.edit).not.toHaveBeenCalled()
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

    expect(fs.existsSync(path.join(tempDir, 'images', 'photo.png'))).toBe(true)
    expect(editor.edit).toHaveBeenCalled()
  })
})
