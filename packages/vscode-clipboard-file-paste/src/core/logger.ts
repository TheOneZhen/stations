import dayjs from 'dayjs'
import * as vscode from 'vscode'

/** Thin wrapper around the VS Code output channel and notification APIs. */
export class Logger {
  static channel: vscode.OutputChannel

  static log(message: unknown): void {
    if (this.channel) {
      const time = dayjs().format('MM-DD HH:mm:ss')
      this.channel.appendLine(`[${time}] ${message}`)
    }
  }

  static showInformationMessage(message: string, ...items: string[]): void {
    this.log(message)
    vscode.window.showInformationMessage(message, ...items)
  }

  static showErrorMessage(message: string, ...items: string[]): void {
    this.log(message)
    vscode.window.showErrorMessage(message, ...items)
  }
}
