import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as vscode from 'vscode'
import { resolveAvailablePath } from './collision'
import { commandPrefix, extensionName } from './constant'
import { Logger } from './logger'
import {
  ensureExtension,
  getFileExtension,
  isHttpURL,
  looksLikeFilePath,
  normalizeDirname,
  parseImageDataUrl,
  parseRawSvg,
  parseReplacer,
  replaceTemplatePlaceholders,
  resolveLocalFilePath,
  sanitizeFullPath,
} from './utils'

export interface LanguageTemplate {
  dirname: string
  filename: string
  altText?: string
  template: string
}

export class Paster {
  /** Entry point: paste clipboard content into the active editor. */
  async paste() {
    const editor = vscode.window.activeTextEditor

    if (!editor) {
      throw new Error('No active editor')
    }

    await this.schedule(editor)
  }

  /**
   * Read clipboard content, save it to the configured path, and insert the template text.
   *
   * VS Code only exposes text via `readText()`. When that returns empty, the clipboard may
   * still hold image binary data (e.g. a screenshot), which is handled by a platform shell script.
   */
  async schedule(editor: vscode.TextEditor) {
    const clipboardText = (await vscode.env.clipboard.readText()).trim()
    let template: string | undefined

    try {
      if (clipboardText) {
        if (isHttpURL(clipboardText)) {
          template = await this.pasteHttpUrl(editor, clipboardText)
        }
        else {
          template = await this.pasteClipboardText(editor, clipboardText)
        }
      }
      else {
        template = await this.pasteClipboardImage(editor)
      }

      if (template) {
        await this.replaceUserSelection(editor, template)
      }
    }
    catch (error) {
      Logger.showErrorMessage(`Failed to paste file: ${error}`)
    }
  }

  private async pasteHttpUrl(editor: vscode.TextEditor, url: string): Promise<string | undefined> {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
    }

    const data = await response.arrayBuffer()
    const buffer = Buffer.from(data)
    const fileExtension = getFileExtension(url) || this.getDefaultTextExtension()

    const { filePath, template } = this.getPasteInfo(editor, fileExtension)
    const savedPath = await this.writeBuffer(filePath, buffer)

    return this.adjustTemplateForSavedPath(template, filePath, savedPath)
  }

  private async pasteClipboardText(editor: vscode.TextEditor, clipboardText: string): Promise<string | undefined> {
    const baseDir = this.getEditorBaseDir(editor)

    if (looksLikeFilePath(clipboardText)) {
      const localPath = resolveLocalFilePath(clipboardText, baseDir)

      if (fs.existsSync(localPath)) {
        const fileExtension = getFileExtension(localPath)
        const { filePath, template } = this.getPasteInfo(editor, fileExtension)
        const savedPath = await this.copyFile(localPath, filePath)

        return this.adjustTemplateForSavedPath(template, filePath, savedPath)
      }
    }

    const clipboardImage = parseImageDataUrl(clipboardText) ?? parseRawSvg(clipboardText)
    if (clipboardImage) {
      const { filePath, template } = this.getPasteInfo(editor, clipboardImage.extension)
      const savedPath = await this.writeBuffer(filePath, clipboardImage.buffer)

      return this.adjustTemplateForSavedPath(template, filePath, savedPath)
    }

    const textExtension = this.getDefaultTextExtension()
    const { filePath, template } = this.getPasteInfo(editor, textExtension)
    const savedPath = await this.writeBuffer(filePath, Buffer.from(clipboardText, 'utf8'))

    return this.adjustTemplateForSavedPath(template, filePath, savedPath)
  }

  private async pasteClipboardImage(editor: vscode.TextEditor): Promise<string | undefined> {
    const { filePath, template } = this.getPasteInfo(editor, 'png')
    const savedPath = await this.resolveCollisionFreePath(filePath)

    await fs.promises.mkdir(path.dirname(savedPath), { recursive: true })

    const result = await this.saveClipboardImageToFile(savedPath)
    if (!result) {
      return undefined
    }

    return this.adjustTemplateForSavedPath(template, filePath, savedPath)
  }

  /**
   * Resolve the absolute save path and the text to insert from workspace templates.
   *
   * Placeholders in `dirname`, `filename`, and `altText` are expanded first; the `template`
   * string then receives the resolved `[dirname]`, `[filename]`, and `[altText]` values.
   */
  getPasteInfo(editor: vscode.TextEditor, copiedFileExt: string) {
    const isUntitled = editor.document.uri.scheme === 'untitled'
    const projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    const editorFileFolder = path.dirname(editor.document.fileName)
    const editorFileLanguageId = editor.document.languageId
    const languageTemplate = this.getLanguageTemplate(editorFileLanguageId)
    const defaultTextExtension = this.getDefaultTextExtension()
    const extension = copiedFileExt || defaultTextExtension

    const dirname = normalizeDirname(sanitizeFullPath(parseReplacer(languageTemplate.dirname)))
    const filename = sanitizeFullPath(
      ensureExtension(parseReplacer(languageTemplate.filename), extension),
    )
    const altText = parseReplacer(languageTemplate.altText ?? 'description')
    const template = replaceTemplatePlaceholders(languageTemplate.template, {
      dirname,
      filename,
      altText,
    })

    const filePath = path.resolve(
      (isUntitled ? projectRootPath : editorFileFolder) ?? '.',
      dirname,
      filename,
    )

    if (!filePath) {
      throw new Error('Failed to get paste info')
    }

    return {
      filePath,
      template,
    }
  }

  private getLanguageTemplate(languageId: string): LanguageTemplate {
    const templates = vscode.workspace
      .getConfiguration(commandPrefix)
      .get<Record<string, LanguageTemplate>>('templates') ?? {}

    const languageTemplate = templates[languageId] ?? templates.markdown

    if (!languageTemplate) {
      throw new Error(`No paste template configured for language "${languageId}"`)
    }

    return languageTemplate
  }

  private getDefaultTextExtension(): string {
    return vscode.workspace
      .getConfiguration(commandPrefix)
      .get<string>('defaultTextExtension') ?? 'txt'
  }

  private getEditorBaseDir(editor: vscode.TextEditor): string {
    const isUntitled = editor.document.uri.scheme === 'untitled'
    const projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

    return (isUntitled ? projectRootPath : path.dirname(editor.document.fileName)) ?? '.'
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath)
      return true
    }
    catch {
      return false
    }
  }

  private async resolveCollisionFreePath(filePath: string): Promise<string> {
    return resolveAvailablePath(filePath, candidate => this.pathExists(candidate))
  }

  private adjustTemplateForSavedPath(
    template: string,
    initialPath: string,
    savedPath: string,
  ): string {
    if (initialPath === savedPath) {
      return template
    }

    const oldName = path.basename(initialPath)
    const newName = path.basename(savedPath)

    return template.replaceAll(oldName, newName)
  }

  /** Write buffer data to disk and return the final saved path. */
  async writeBuffer(filePath: string, data: Buffer | Uint8Array): Promise<string> {
    const savedPath = await this.resolveCollisionFreePath(filePath)

    await fs.promises.mkdir(path.dirname(savedPath), { recursive: true })
    await fs.promises.writeFile(savedPath, new Uint8Array(data))

    return savedPath
  }

  /** Copy an existing file to the destination path and return the final saved path. */
  async copyFile(src: string, dest: string): Promise<string> {
    const savedPath = await this.resolveCollisionFreePath(dest)

    await fs.promises.mkdir(path.dirname(savedPath), { recursive: true })
    await fs.promises.copyFile(src, savedPath)

    return savedPath
  }

  /** Promise wrapper around {@link readClipboardImage}. */
  saveClipboardImageToFile(filePath: string): Promise<string> {
    return new Promise((resolve) => {
      this.readClipboardImage(filePath, (_filePath, result) => {
        resolve(result)
      })
    })
  }

  /**
   * Read a clipboard image through a platform shell script and save it to `filePath`.
   *
   * The script writes image bytes directly to `filePath`. Stdout carries only a status string
   * (saved path, empty string, or `no xclip` on Linux).
   */
  readClipboardImage(filePath: string, callback: (filePath: string, result: string) => void) {
    const shell = this.spawnClipboardShell(filePath)
    if (!shell) {
      callback(filePath, '')
      return
    }

    const chunks: Buffer[] = []

    shell.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        Logger.showErrorMessage(`Cannot find the shell: ${error.message}`)
      }
      else {
        Logger.showErrorMessage(error.message)
      }
      Logger.log(`[${extensionName}] ${error.stack}`)
      callback(filePath, '')
    })
    shell.stdout.on('data', (data: Buffer) => {
      chunks.push(data)
    })
    shell.on('close', () => {
      const result = Buffer.concat(chunks as Uint8Array[]).toString().trim()
      if (result === 'no xclip') {
        Logger.showInformationMessage('You need to install xclip command first.')
        callback(filePath, '')
        return
      }
      callback(filePath, result)
    })
  }

  /**
   * Spawn a platform-specific process that reads the clipboard image and writes it to `filePath`.
   *
   * Scripts live under `res/` relative to the compiled `dist/` output.
   */
  private spawnClipboardShell(filePath: string): ChildProcessWithoutNullStreams | undefined {
    const platform = process.platform

    if (platform === 'win32') {
      const scriptPath = path.join(__dirname, '../res/pc.ps1')
      let command = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
      const powershellExisted = fs.existsSync(command)

      if (!powershellExisted) {
        command = 'powershell'
      }
      return spawn(command, [
        '-noprofile',
        '-noninteractive',
        '-nologo',
        '-sta',
        '-executionpolicy',
        'unrestricted',
        '-windowstyle',
        'hidden',
        '-file',
        scriptPath,
        filePath,
      ])
    }

    if (platform === 'darwin') {
      const ascriptPath = path.join(__dirname, '../res/mac.applescript')
      return spawn('osascript', [ascriptPath, filePath])
    }

    if (platform === 'linux') {
      const scriptPath = path.join(__dirname, '../res/linux.sh')
      return spawn('sh', [scriptPath, filePath])
    }

    Logger.log(`[${extensionName}] Unsupported platform: ${platform}`)
    return undefined
  }

  /** Replace the current editor selection with the resolved template text. */
  async replaceUserSelection(editor: vscode.TextEditor, template: string) {
    await editor.edit((editBuilder) => {
      editBuilder.replace(editor.selection, template)
    })
  }
}
