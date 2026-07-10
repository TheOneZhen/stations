import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";
import type { ClipboardBridge, ClipboardImageData } from "./webviewBridge";
import {
  readImageFromClipboardText,
  readImageFromPowerShell,
} from "./webviewBridge";

const execFileAsync = promisify(execFile);

export async function readClipboardImage(
  bridge: ClipboardBridge,
): Promise<ClipboardImageData | undefined> {
  const fromText = await readImageFromClipboardText(
    () => vscode.env.clipboard.readText(),
    (uri) => vscode.workspace.fs.readFile(uri),
  );
  if (fromText) {
    return fromText;
  }

  const fromPowerShell = await readImageFromPowerShell(
    path.join(os.tmpdir(), `vscode-clipboard-image-paste-${Date.now()}.png`),
    async (scriptPath) => {
      await execFileAsync(
        "powershell",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
        { windowsHide: true },
      );
    },
    async (filePath) => fs.readFile(filePath),
  );
  if (fromPowerShell) {
    return fromPowerShell;
  }

  return bridge.readImage();
}
