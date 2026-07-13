import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import * as vscode from 'vscode'
import { extensionName, pasteCommandTemplates } from './constant'
import { Logger } from './logger'
import { getFileExtension, isHttpURL, parseReplacer, sanitizeFullPath } from './utils'

export class Paster {
  // main paste function
  paste() {
    const editor = vscode.window.activeTextEditor

    if (!editor)
      throw new Error('No active editor')

    this.schedule(editor)
  }

  async schedule(editor: vscode.TextEditor) {
    const clipboardText = await promisify<string>(vscode.env.clipboard.readText)()
    let filePath: string
    let template: string | undefined

    if (clipboardText) {
      if (isHttpURL(clipboardText)) {
        // if clipboard is a http URL, download the file and paste it
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
            // if the file exists
            const fileExtension = getFileExtension(url);

            ({ filePath, template } = this.getPasteInfo(editor, fileExtension))
            this.copyFile(url, filePath)
          }
          else {
            // plain text
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
      // if clipboard is empty, maybe it's image
      ({ filePath, template } = this.getPasteInfo(editor, 'png'))
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

      const result = await this.saveClipboardImageToFile(filePath)
      if (!result) {
        Logger.showInformationMessage('There is not an image in the clipboard.')
        return
      }
    }
    if (template !== undefined) {
      await this.replaceUserSelection(editor, template)
    }
  }

  /* get paste info */
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

  writeFile(filePath: string, data: Buffer) {
    fs.writeFile(filePath, data.toString().trim(), (err) => {
      if (err) {
        Logger.showErrorMessage(`Failed to write file: ${err.message}`)
      }
    })
  }

  copyFile(src: string, dest: string) {
    fs.copyFile(src, dest, (err) => {
      if (err) {
        Logger.showErrorMessage(`Failed to copy file: ${err.message}`)
      }
    })
  }

  /* save the clipboard image to the target file path */
  saveClipboardImageToFile(filePath: string): Promise<string> {
    return new Promise((resolve) => {
      this.readClipboardImage(filePath, (_filePath, result) => {
        resolve(result)
      })
    })
  }

  /* read clipboard image via shell and save to the target file path */
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

  /* spawn the clipboard shell */
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

  async replaceUserSelection(editor: vscode.TextEditor, template: string) {
    await editor.edit((editBuilder) => {
      editBuilder.replace(editor.selection, template)
    })
  }
}
