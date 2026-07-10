import * as path from "node:path";
import * as vscode from "vscode";
import { readClipboardImage } from "../clipboard/readClipboardImage";
import type { ClipboardBridge } from "../clipboard/webviewBridge";
import {
  getExtensionSettings,
  getTemplateForLanguage,
} from "../config/settings";
import { insertReference } from "../editor/insertReference";
import { PathExtractionError } from "../template/pathExtractor";
import {
  ensureDirectoryExists,
  inferImageExtension,
  resolveTemplate,
} from "../template/templateEngine";

export async function pasteImageCommand(
  bridge: ClipboardBridge,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showWarningMessage("No active editor.");
    return;
  }

  const { templates, supportedImageExtensions } = getExtensionSettings();
  const languageId = editor.document.languageId;
  const template = getTemplateForLanguage(languageId, templates);
  if (!template) {
    await vscode.window.showWarningMessage(
      `No paste template configured for language "${languageId}". Add it to clipboardImagePaste.templates.`,
    );
    return;
  }

  const clipboardImage = await readClipboardImage(bridge);
  if (!clipboardImage) {
    await vscode.window.showWarningMessage(
      "No usable image found on the clipboard.",
    );
    return;
  }

  const documentUri = editor.document.uri;
  if (documentUri.scheme !== "file") {
    await vscode.window.showWarningMessage(
      "Paste image is only supported for files on disk.",
    );
    return;
  }

  const documentDir = path.dirname(documentUri.fsPath);
  const imageExtension = inferImageExtension(
    clipboardImage.mimeType,
    clipboardImage.fileName,
    supportedImageExtensions,
  );

  let resolution;
  try {
    resolution = await resolveTemplate({
      template,
      languageId,
      documentDir,
      imageExtension,
      pathExists: async (absolutePath) => {
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(absolutePath));
          return true;
        } catch {
          return false;
        }
      },
    });
  } catch (error) {
    if (error instanceof PathExtractionError) {
      await vscode.window.showWarningMessage(
        `${error.message} Template: ${template}`,
      );
      return;
    }
    await vscode.window.showErrorMessage(
      error instanceof Error ? error.message : String(error),
    );
    return;
  }

  try {
    await ensureDirectoryExists(resolution.absoluteSavePath, async (dir) => {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
    });
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(resolution.absoluteSavePath),
      clipboardImage.bytes,
    );
    await insertReference(editor, resolution.insertText, languageId);
  } catch (error) {
    await vscode.window.showErrorMessage(
      error instanceof Error ? error.message : String(error),
    );
  }
}
