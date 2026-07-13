import * as vscode from 'vscode'
import { extensionName, pasteCommand } from './core/constant'
import { Logger } from './core/logger'
import { Paster } from './core/paste'

export function activate(context: vscode.ExtensionContext): void {
  Logger.channel = vscode.window.createOutputChannel(extensionName)
  context.subscriptions.push(Logger.channel)
  Logger.log(`[${extensionName}] activated!`)

  const paster = new Paster()

  const dispose = vscode.commands.registerCommand(pasteCommand, async () => {
    try {
      Logger.log(`[${extensionName}] paste command executed!`)
      await paster.paste()
    }
    catch (error) {
      Logger.showErrorMessage(`[${extensionName}] paste failed: ${error}`)
    }
  })

  context.subscriptions.push(dispose)
}

export function deactivate(): void {}
