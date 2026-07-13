import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as vscode from 'vscode'
import { extensionName, pasteCommandTemplates } from './constant'
import { Logger } from './logger'
import { getFileExtension, isHttpURL, parseReplacer, sanitizeFullPath } from './utils'

export class Paster {
  /** Entry point: paste clipboard content into the active editor. */
  paste() {
    const editor = vscode.window.activeTextEditor

    if (!editor)
      throw new Error('No active editor')

    this.schedule(editor)
  }

  /**
   * Read clipboard content, save it to the configured path, and insert the template text.
   *
   * VS Code only exposes text via `readText()`. When that returns empty, the clipboard may
   * still hold image binary data (e.g. a screenshot), which is handled by a platform shell script.
   */
  async schedule(editor: vscode.TextEditor) {
    const clipboardText = await new Promise<string>((resolve) => {
      vscode.env.clipboard.readText().then(text => resolve(text.trim()))
    })
    let filePath: string
    let template: string | undefined

    if (clipboardText) {
      if (isHttpURL(clipboardText)) {
        // HTTP(S) URL: download remote content and save with the URL file extension.
        const response = await fetch(clipboardText)
        const data = await response.arrayBuffer()
        const buffer = Buffer.from(data)
        const fileExtension = getFileExtension(clipboardText);

        ({ filePath, template } = this.getPasteInfo(editor, fileExtension))
        this.writeFile(filePath, buffer)
      }
      else {
        try {
          const url = path.resolve(clipboardText)

          if (fs.existsSync(url)) {
            // Local file path: copy the existing file and preserve its extension.
            const fileExtension = getFileExtension(url);

            ({ filePath, template } = this.getPasteInfo(editor, fileExtension))
            this.copyFile(url, filePath)
          }
          else {
            console.log('clipboardText is not a file path', clipboardText);
            // Plain text: save as a text file using the default text extension.
            ({ filePath, template } = this.getPasteInfo(editor, ''))
            this.writeFile(filePath, Buffer.from(clipboardText))
          }
        }
        catch (error) {
          Logger.showErrorMessage(`Failed to paste file: ${error}`)
        }
      }
    }
    else {
      // No text in the clipboard; try reading an image via a platform shell script.
      ({ filePath, template } = this.getPasteInfo(editor, 'png'))
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

      const result = await this.saveClipboardImageToFile(filePath)
      if (!result) {
        return
      }
    }

    // Skip insertion when an earlier branch failed or the clipboard had no image.
    if (template !== undefined) {
      await this.replaceUserSelection(editor, template)
    }
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
    const configuration = vscode.workspace.getConfiguration(pasteCommandTemplates)[editorFileLanguageId]
    let { dirname, filename, altText, template } = configuration.get(editorFileLanguageId)

    dirname = sanitizeFullPath(parseReplacer(dirname))
    filename = sanitizeFullPath(parseReplacer(`${filename}.${copiedFileExt}`))
    altText = parseReplacer(altText)
    template = template.replace('[dirname]', dirname).replace('[filename]', filename).replace('[altText]', altText)

    const filePath = path.resolve(
      // Untitled documents have no folder; fall back to the workspace root.
      (isUntitled ? projectRootPath : editorFileFolder) ?? '.',
      dirname,
      filename,
    )

    if (!filePath)
      throw new Error('Failed to get paste info')

    return {
      filePath,
      template,
    }
  }

  /** Write buffer data to disk. */
  writeFile(filePath: string, data: Buffer) {
    fs.writeFile(filePath, data.toString().trim(), (err) => {
      if (err) {
        Logger.showErrorMessage(`Failed to write file: ${err.message}`)
      }
    })
  }

  /** Copy an existing file to the destination path. */
  copyFile(src: string, dest: string) {
    fs.copyFile(src, dest, (err) => {
      if (err) {
        Logger.showErrorMessage(`Failed to copy file: ${err.message}`)
      }
    })
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
   * (saved path, empty string, `no image`, or `no xclip` on Linux).
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
