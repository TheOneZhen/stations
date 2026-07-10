const MARKDOWN_IMAGE_PATH = /!\[[^\]]*\]\(([^)]+)\)/;
const HTML_IMAGE_SRC = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i;
const GENERIC_PATH =
  /(?:\.{1,2}\/|\/)?[\w./\\-]*\[(?:YYYY|RID)[^\]]*\][\w./\\-]*/;

export class PathExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathExtractionError";
  }
}

export function extractImagePathPattern(
  template: string,
  languageId: string,
): string {
  if (languageId === "markdown") {
    const match = template.match(MARKDOWN_IMAGE_PATH);
    if (match?.[1]) {
      return match[1];
    }
    throw new PathExtractionError(
      "Could not extract image path from markdown template.",
    );
  }

  if (languageId === "html") {
    const match = template.match(HTML_IMAGE_SRC);
    if (match?.[1]) {
      return match[1];
    }
    throw new PathExtractionError(
      "Could not extract image path from html template.",
    );
  }

  const match = template.match(GENERIC_PATH);
  if (match?.[0]) {
    return match[0];
  }

  throw new PathExtractionError(
    `Could not extract image path from template for language "${languageId}".`,
  );
}

export function replaceImagePathInTemplate(
  template: string,
  languageId: string,
  resolvedPath: string,
): string {
  if (languageId === "markdown") {
    return template.replace(MARKDOWN_IMAGE_PATH, (_match, path: string) =>
      _match.replace(path, resolvedPath),
    );
  }

  if (languageId === "html") {
    return template.replace(HTML_IMAGE_SRC, (match, path: string) =>
      match.replace(path, resolvedPath),
    );
  }

  const pattern = extractImagePathPattern(template, languageId);
  return template.replace(pattern, resolvedPath);
}
