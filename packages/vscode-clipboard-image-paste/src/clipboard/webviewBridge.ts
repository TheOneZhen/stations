import * as fs from "node:fs/promises";
import * as vscode from "vscode";

export interface ClipboardImageData {
  bytes: Uint8Array;
  mimeType: string;
  fileName?: string;
}

export interface ClipboardBridge {
  readImage(): Promise<ClipboardImageData | undefined>;
  dispose(): void;
}

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
]);

export function createClipboardBridge(
  context: vscode.ExtensionContext,
): ClipboardBridge {
  let panel: vscode.WebviewPanel | undefined;
  let disposed = false;

  const dispose = () => {
    disposed = true;
    panel?.dispose();
    panel = undefined;
  };

  const readImage = (): Promise<ClipboardImageData | undefined> =>
    new Promise((resolve) => {
      if (disposed) {
        resolve(undefined);
        return;
      }

      panel = vscode.window.createWebviewPanel(
        "clipboardImagePasteBridge",
        "Clipboard Bridge",
        { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        },
      );

      panel.webview.html = getBridgeHtml(panel.webview);

      const timeout = setTimeout(() => {
        cleanup();
        resolve(undefined);
      }, 8000);

      const cleanup = () => {
        clearTimeout(timeout);
        subscription.dispose();
        panel?.dispose();
        panel = undefined;
      };

      const subscription = panel.webview.onDidReceiveMessage(
        async (message: {
          type: string;
          bytes?: number[];
          mimeType?: string;
          error?: string;
        }) => {
          if (message.type === "ready") {
            panel?.webview.postMessage({ type: "read" });
            return;
          }

          if (message.type === "image" && message.bytes && message.mimeType) {
            cleanup();
            resolve({
              bytes: Uint8Array.from(message.bytes),
              mimeType: message.mimeType,
            });
            return;
          }

          if (message.type === "error" || message.type === "empty") {
            cleanup();
            resolve(undefined);
          }
        },
      );

      panel.onDidDispose(() => {
        clearTimeout(timeout);
        subscription.dispose();
        resolve(undefined);
      });
    });

  context.subscriptions.push({ dispose });

  return { readImage, dispose };
}

function getBridgeHtml(webview: vscode.Webview): string {
  const cspSource = webview.cspSource;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${cspSource} 'unsafe-inline';" />
</head>
<body>
<script>
  const vscode = acquireVsCodeApi();
  const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/bmp", "image/svg+xml"];

  window.addEventListener("message", async (event) => {
    if (event.data?.type !== "read") {
      return;
    }

    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        vscode.postMessage({ type: "error", error: "Clipboard API unavailable" });
        return;
      }

      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of IMAGE_TYPES) {
          if (!item.types.includes(type)) {
            continue;
          }
          const blob = await item.getType(type);
          const buffer = await blob.arrayBuffer();
          const bytes = Array.from(new Uint8Array(buffer));
          vscode.postMessage({ type: "image", bytes, mimeType: type });
          return;
        }
      }

      vscode.postMessage({ type: "empty" });
    } catch (error) {
      vscode.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  vscode.postMessage({ type: "ready" });
</script>
</body>
</html>`;
}

export async function readImageFromClipboardText(
  readText: () => Promise<string>,
  readFile: (uri: vscode.Uri) => Promise<Uint8Array>,
): Promise<ClipboardImageData | undefined> {
  const text = (await readText()).trim();
  if (!text) {
    return undefined;
  }

  const candidate = text.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  const ext = getExtension(candidate);
  if (!ext || !IMAGE_EXTENSIONS.has(ext)) {
    return undefined;
  }

  try {
    const uri = vscode.Uri.file(candidate);
    const bytes = await readFile(uri);
    return {
      bytes,
      mimeType: mimeTypeFromExtension(ext),
      fileName: candidate.split(/[/\\]/).pop(),
    };
  } catch {
    return undefined;
  }
}

function getExtension(filePath: string): string | undefined {
  const index = filePath.lastIndexOf(".");
  if (index === -1) {
    return undefined;
  }
  return filePath.slice(index).toLowerCase();
}

function mimeTypeFromExtension(ext: string): string {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
}

export async function readImageFromPowerShell(
  tempPath: string,
  runScriptFile: (scriptPath: string) => Promise<void>,
  readFile: (filePath: string) => Promise<Uint8Array>,
): Promise<ClipboardImageData | undefined> {
  if (process.platform !== "win32") {
    return undefined;
  }

  const escapedPath = tempPath.replace(/'/g, "''");
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "$img = [System.Windows.Forms.Clipboard]::GetImage()",
    "if ($null -eq $img) { exit 1 }",
    `$img.Save('${escapedPath}', [System.Drawing.Imaging.ImageFormat]::Png)`,
  ].join("\n");

  const scriptPath = `${tempPath}.ps1`;

  try {
    await fs.writeFile(scriptPath, script, "utf8");
    await runScriptFile(scriptPath);
    const bytes = await readFile(tempPath);
    return { bytes, mimeType: "image/png" };
  } catch {
    return undefined;
  } finally {
    await Promise.allSettled([
      fs.unlink(scriptPath).catch(() => undefined),
      fs.unlink(tempPath).catch(() => undefined),
    ]);
  }
}
