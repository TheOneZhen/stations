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
    // get selection text and replace it
    const selectText = editor.document.getText(editor.selection)
    if (selectText) {
      // todo
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

  async schedule(editor: vscode.TextEditor) {
    const clipboardText = await promisify<string>(vscode.env.clipboard.readText)()
    let filePath: string
    let template: string

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

  /* read clipboard file and return the file path and data */
  readClipboardFile(filePath: string, callback: (filePath: string, data: Buffer) => void) {
    const platform = process.platform
    let shell: ChildProcessWithoutNullStreams

    if (platform === 'win32') {
      const scriptPath = path.join(__dirname, '../../res/pc.ps1')
      let command = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
      const powershellExisted = fs.existsSync(command)

      if (!powershellExisted) {
        command = 'powershell'
      }
      shell = spawn(command, [
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
    else if (platform === 'darwin') {
      const ascriptPath = path.join(__dirname, '../../res/mac.applescript')

      shell = spawn('osascript', [ascriptPath, filePath])
    }
    else if (platform === 'linux') {
      const scriptPath = path.join(__dirname, '../../res/linux.sh')
      shell = spawn('sh', [scriptPath, filePath])
    }
    else {
      return void 0
    }

    shell.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        Logger.showErrorMessage(`Cannot find the shell: ${error.message}`)
      }
      else {
        Logger.showErrorMessage(error.message)
      }
      Logger.log(`[${extensionName}] ${error.stack}`)
    })
    shell.stdout.on('data', (data: Buffer) => {
      callback(filePath, data)
    })
  }
}
