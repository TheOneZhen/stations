import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import * as vscode from 'vscode'
import { findAltTextSelection } from './altTextSelection'
import { resolveAvailablePath } from './collision'
import { commandPrefix, extensionName } from './constant'
import { downloadUrl } from './httpDownload'
import { Logger } from './logger'
import { validateLanguageTemplate } from './templateConfig'
import type { LanguageTemplate, PasteContext } from './types'
import {
  assertSafeDirname,
  ensureExtension,
  extensionFromContentType,
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
import {
  copyFilePath,
  fileExists,
  hostPathExists,
  readFileBytes,
  removeFileIfExists,
  writeFileBytes,
} from './workspaceFs'

export type { LanguageTemplate, PasteContext } from './types'

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
    const rawClipboardText = await vscode.env.clipboard.readText()

    try {
      let template: string | undefined

      if (!rawClipboardText.trim()) {
        template = await this.pasteClipboardImage(editor)
      }
      else if (isHttpURL(rawClipboardText.trim())) {
        template = await this.pasteHttpUrl(editor, rawClipboardText.trim())
      }
      else {
        template = await this.pasteClipboardText(editor, rawClipboardText)
      }

      if (template) {
        await this.replaceUserSelection(editor, template, editor.document.languageId)
      }
    }
    catch (error) {
      Logger.showErrorMessage(`Failed to paste file: ${error}`)
    }
  }

  private async pasteHttpUrl(editor: vscode.TextEditor, url: string): Promise<string | undefined> {
    const { buffer, contentType } = await downloadUrl(url)
    const fileExtension = getFileExtension(url)
      || extensionFromContentType(contentType)
      || this.getDefaultTextExtension()
    const context = this.getPasteInfo(editor, fileExtension)
    const savedPath = await this.writeBuffer(context.filePath, buffer)

    return this.buildTemplateFromSavedPath(context, savedPath)
  }

  private async pasteClipboardText(editor: vscode.TextEditor, clipboardText: string): Promise<string | undefined> {
    const baseDir = this.getSaveBaseDir(editor)

    if (looksLikeFilePath(clipboardText.trim())) {
      const localPath = resolveLocalFilePath(clipboardText.trim(), baseDir)

      if (await fileExists(localPath)) {
        const fileExtension = getFileExtension(localPath)
        const context = this.getPasteInfo(editor, fileExtension)
        const savedPath = await this.copyFile(localPath, context.filePath)

        return this.buildTemplateFromSavedPath(context, savedPath)
      }
    }

    const clipboardImage = parseImageDataUrl(clipboardText) ?? parseRawSvg(clipboardText)
    if (clipboardImage) {
      const context = this.getPasteInfo(editor, clipboardImage.extension)
      const savedPath = await this.writeBuffer(context.filePath, clipboardImage.buffer)

      return this.buildTemplateFromSavedPath(context, savedPath)
    }

    const textExtension = this.getDefaultTextExtension()
    const context = this.getPasteInfo(editor, textExtension)
    const savedPath = await this.writeBuffer(context.filePath, Buffer.from(clipboardText, 'utf8'))

    return this.buildTemplateFromSavedPath(context, savedPath)
  }

  private async pasteClipboardImage(editor: vscode.TextEditor): Promise<string | undefined> {
    const context = this.getPasteInfo(editor, 'png')
    const savedPath = await this.resolveCollisionFreePath(context.filePath)
    const tempPath = path.join(os.tmpdir(), `clipboard-file-paste-${Date.now()}.img`)

    try {
      const result = await this.saveClipboardImageToTemp(tempPath)
      if (!result) {
        return undefined
      }

      const imageBytes = await readFileBytes(tempPath)
      if (!imageBytes.byteLength) {
        return undefined
      }

      await writeFileBytes(savedPath, imageBytes)

      return this.buildTemplateFromSavedPath(context, savedPath)
    }
    finally {
      await removeFileIfExists(tempPath)
    }
  }

  /**
   * Resolve the absolute save path and the text to insert from workspace templates.
   *
   * Placeholders in `dirname`, `filename`, and `altText` are expanded first; the `template`
   * string then receives the resolved `[dirname]`, `[filename]`, and `[altText]` values.
   */
  getPasteInfo(editor: vscode.TextEditor, copiedFileExt: string): PasteContext {
    const languageTemplate = this.getLanguageTemplate(editor.document.languageId)
    const defaultTextExtension = this.getDefaultTextExtension()
    const extension = copiedFileExt || defaultTextExtension
    const dirname = normalizeDirname(
      sanitizeFullPath(parseReplacer(languageTemplate.dirname)),
    )
    const filename = sanitizeFullPath(
      ensureExtension(parseReplacer(languageTemplate.filename), extension),
    )
    const altText = parseReplacer(languageTemplate.altText ?? 'description')

    assertSafeDirname(dirname)

    const filePath = path.resolve(this.getSaveBaseDir(editor), dirname, filename)
    const template = replaceTemplatePlaceholders(languageTemplate.template, {
      dirname,
      filename,
      altText,
    })

    if (!filePath) {
      throw new Error('Failed to get paste info')
    }

    return {
      filePath,
      dirname,
      filename,
      altText,
      template,
      languageTemplate,
    }
  }

  buildTemplateFromSavedPath(context: PasteContext, savedPath: string): string {
    const savedFilename = path.basename(savedPath)

    return replaceTemplatePlaceholders(context.languageTemplate.template, {
      dirname: context.dirname,
      filename: savedFilename,
      altText: context.altText,
    })
  }

  private getLanguageTemplate(languageId: string): LanguageTemplate {
    const templates = vscode.workspace
      .getConfiguration(commandPrefix)
      .get<Record<string, unknown>>('templates') ?? {}

    const configured = templates[languageId] ?? templates.markdown

    if (!configured) {
      throw new Error(`No paste template configured for language "${languageId}"`)
    }

    return validateLanguageTemplate(configured, templates[languageId] ? languageId : 'markdown')
  }

  private getDefaultTextExtension(): string {
    return vscode.workspace
      .getConfiguration(commandPrefix)
      .get<string>('defaultTextExtension') ?? 'txt'
  }

  private getSaveBaseDir(editor: vscode.TextEditor): string {
    const isUntitled = editor.document.uri.scheme === 'untitled'

    if (isUntitled) {
      const projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      if (!projectRootPath) {
        throw new Error('Cannot determine save location for untitled files without an open workspace.')
      }
      return projectRootPath
    }

    const documentPath = editor.document.uri.fsPath || editor.document.fileName
    if (!documentPath || documentPath === 'untitled') {
      throw new Error('Cannot determine save location for the active editor.')
    }

    return path.dirname(documentPath)
  }

  private async resolveCollisionFreePath(filePath: string): Promise<string> {
    return resolveAvailablePath(filePath, candidate => fileExists(candidate))
  }

  /** Write buffer data to disk and return the final saved path. */
  async writeBuffer(filePath: string, data: Buffer | Uint8Array): Promise<string> {
    const savedPath = await this.resolveCollisionFreePath(filePath)

    await writeFileBytes(savedPath, new Uint8Array(data))

    return savedPath
  }

  /** Copy an existing file to the destination path and return the final saved path. */
  async copyFile(src: string, dest: string): Promise<string> {
    const savedPath = await this.resolveCollisionFreePath(dest)

    await copyFilePath(src, savedPath)

    return savedPath
  }

  /** Promise wrapper around {@link readClipboardImage}. */
  saveClipboardImageToTemp(tempPath: string): Promise<string> {
    return new Promise((resolve) => {
      void this.readClipboardImage(tempPath, (_tempPath, result) => {
        resolve(result)
      })
    })
  }

  /**
   * Read a clipboard image through a platform shell script and save it to a temp file.
   *
   * Shell scripts only write to a temp path on the extension host. The final workspace file
   * is created later through `writeFileBytes`.
   *
   * Stdout carries only a status string (saved path, empty string, or `no xclip` on Linux).
   */
  async readClipboardImage(tempPath: string, callback: (tempPath: string, result: string) => void) {
    const shell = await this.spawnClipboardShell(tempPath)
    if (!shell) {
      callback(tempPath, '')
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
      callback(tempPath, '')
    })
    shell.stdout.on('data', (data: Buffer) => {
      chunks.push(data)
    })
    shell.on('close', () => {
      const result = Buffer.concat(chunks as Uint8Array[]).toString().trim()
      if (result === 'no xclip') {
        Logger.showInformationMessage('You need to install xclip command first.')
        callback(tempPath, '')
        return
      }
      callback(tempPath, result)
    })
  }

  /**
   * Spawn a platform-specific process that reads the clipboard image and writes it to `tempPath`.
   *
   * Scripts live under `res/` relative to the compiled `dist/` output.
   */
  private async spawnClipboardShell(tempPath: string): Promise<ChildProcessWithoutNullStreams | undefined> {
    const platform = process.platform

    if (platform === 'win32') {
      const scriptPath = path.join(__dirname, '../res/pc.ps1')
      const systemPowerShell = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
      const command = await hostPathExists(systemPowerShell) ? systemPowerShell : 'powershell'

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
        tempPath,
      ])
    }

    if (platform === 'darwin') {
      const ascriptPath = path.join(__dirname, '../res/mac.applescript')
      return spawn('osascript', [ascriptPath, tempPath])
    }

    if (platform === 'linux') {
      const scriptPath = path.join(__dirname, '../res/linux.sh')
      return spawn('sh', [scriptPath, tempPath])
    }

    Logger.log(`[${extensionName}] Unsupported platform: ${platform}`)
    return undefined
  }

  /** Replace the current editor selection with the resolved template text. */
  async replaceUserSelection(editor: vscode.TextEditor, template: string, languageId: string) {
    const insertStart = editor.selection.start
    const success = await editor.edit((editBuilder) => {
      editBuilder.replace(editor.selection, template)
    })

    const altRange = findAltTextSelection(template, languageId)
    if (success && altRange) {
      editor.selection = new vscode.Selection(
        insertStart.translate(0, altRange.start),
        insertStart.translate(0, altRange.end),
      )
    }
  }
}
