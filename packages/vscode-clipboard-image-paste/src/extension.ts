import * as vscode from "vscode";
import { pasteImageCommand } from "./commands/pasteImage";
import { createClipboardBridge } from "./clipboard/webviewBridge";

let clipboardBridge: ReturnType<typeof createClipboardBridge> | undefined;

export function activate(context: vscode.ExtensionContext): void {
  clipboardBridge = createClipboardBridge(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("clipboardImagePaste.paste", async () => {
      if (!clipboardBridge) {
        clipboardBridge = createClipboardBridge(context);
      }
      await pasteImageCommand(clipboardBridge);
    }),
  );
}

export function deactivate(): void {
  clipboardBridge?.dispose();
  clipboardBridge = undefined;
}
