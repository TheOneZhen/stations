import * as vscode from "vscode";

export interface ExtensionSettings {
  templates: Record<string, string>;
  supportedImageExtensions: string[];
}

export function getExtensionSettings(): ExtensionSettings {
  const config = vscode.workspace.getConfiguration("clipboardImagePaste");
  return {
    templates: config.get<Record<string, string>>("templates") ?? {},
    supportedImageExtensions:
      config.get<string[]>("supportedImageExtensions") ?? [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "webp",
        "svg",
        "bmp",
      ],
  };
}

export function getTemplateForLanguage(
  languageId: string,
  templates: Record<string, string>,
): string | undefined {
  return templates[languageId];
}
