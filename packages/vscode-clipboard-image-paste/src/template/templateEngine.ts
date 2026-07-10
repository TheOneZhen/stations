import type { PlaceholderContext } from "./placeholders";
import {
  ensureExtension,
  extensionFromFileName,
  resolvePlaceholders,
} from "./placeholders";
import {
  extractImagePathPattern,
  replaceImagePathInTemplate,
} from "./pathExtractor";
import {
  resolveToAbsolutePath,
  toRelativeReferencePath,
} from "../path/resolvePath";
import { resolveAvailablePath } from "../path/collision";
import * as path from "node:path";

export interface TemplateResolutionInput {
  template: string;
  languageId: string;
  documentDir: string;
  imageExtension: string;
  placeholderContext?: PlaceholderContext;
  pathExists: (absolutePath: string) => Promise<boolean>;
}

export interface TemplateResolutionResult {
  absoluteSavePath: string;
  insertText: string;
  referencePath: string;
}

export async function resolveTemplate(
  input: TemplateResolutionInput,
): Promise<TemplateResolutionResult> {
  const pathPattern = extractImagePathPattern(
    input.template,
    input.languageId,
  );

  const resolvedPathPattern = resolvePlaceholders(
    pathPattern,
    input.placeholderContext,
  );
  const resolvedPathWithExt = ensureExtension(
    resolvedPathPattern,
    input.imageExtension,
  );

  const preliminaryAbsolutePath = resolveToAbsolutePath(
    resolvedPathWithExt,
    input.documentDir,
  );

  const absoluteSavePath = await resolveAvailablePath(
    preliminaryAbsolutePath,
    input.pathExists,
  );

  const referencePath = toRelativeReferencePath(
    absoluteSavePath,
    input.documentDir,
    pathPattern,
  );

  const insertText = replaceImagePathInTemplate(
    input.template,
    input.languageId,
    referencePath,
  );

  return {
    absoluteSavePath,
    insertText,
    referencePath,
  };
}

export function inferImageExtension(
  mimeType: string | undefined,
  fileName: string | undefined,
  supportedExtensions: string[],
): string {
  const fromName = fileName ? extensionFromFileName(fileName) : "png";
  const normalized = fromName.toLowerCase();

  if (supportedExtensions.includes(normalized)) {
    return normalized;
  }

  if (mimeType) {
    const fromMime = extensionFromMimeTypeSafe(mimeType);
    if (supportedExtensions.includes(fromMime)) {
      return fromMime;
    }
  }

  return supportedExtensions[0] ?? "png";
}

function extensionFromMimeTypeSafe(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }
  if (normalized.includes("png")) {
    return "png";
  }
  if (normalized.includes("webp")) {
    return "webp";
  }
  if (normalized.includes("gif")) {
    return "gif";
  }
  if (normalized.includes("svg")) {
    return "svg";
  }
  if (normalized.includes("bmp")) {
    return "bmp";
  }
  return "png";
}

export async function ensureDirectoryExists(
  absoluteFilePath: string,
  mkdir: (dir: string) => Promise<void>,
): Promise<void> {
  await mkdir(path.dirname(absoluteFilePath));
}
