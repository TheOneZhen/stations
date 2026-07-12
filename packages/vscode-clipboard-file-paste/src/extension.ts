import * as vscode from 'vscode'
import { name as extensionName } from '../package.json'
import { Logger } from './core/logger'

const pasteCommand = `extension.${extensionName}`

export function activate(context: vscode.ExtensionContext): void {
  // create Logger channel
  Logger.channel = vscode.window.createOutputChannel(extensionName)
  // add Logger channel to context subscriptions
  context.subscriptions.push(Logger.channel)
  Logger.log(`[${extensionName}] activated!`)

  const dispose = vscode.commands.registerCommand(pasteCommand, async () => {
    try {
      Logger.log(`[${extensionName}] paste command executed!`)
    }
    catch (error) {
      Logger.showErrorMessage(`[${extensionName}] paste failed: ${error}`)
    }
  })

  context.subscriptions.push(dispose)
}
/// TODO
export function deactivate(): void {}
