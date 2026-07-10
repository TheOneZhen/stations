import * as path from "node:path";

export function isAbsolutePath(value: string): boolean {
  return path.isAbsolute(value);
}

export function resolveToAbsolutePath(
  pathValue: string,
  documentDir: string,
): string {
  if (isAbsolutePath(pathValue)) {
    return path.normalize(pathValue);
  }
  return path.normalize(path.join(documentDir, pathValue));
}

export function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

export function toRelativeReferencePath(
  absolutePath: string,
  documentDir: string,
  originalPattern: string,
): string {
  if (isAbsolutePath(originalPattern)) {
    return toPosixPath(absolutePath);
  }

  const relative = path.relative(documentDir, absolutePath);
  const normalized = toPosixPath(relative);
  if (originalPattern.startsWith("./") && !normalized.startsWith(".")) {
    return `./${normalized}`;
  }
  return normalized;
}
