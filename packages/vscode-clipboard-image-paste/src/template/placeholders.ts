import dayjs from "dayjs";

const PLACEHOLDER_PATTERN = /\[([^\]]+)\]/g;
const RID_PATTERN = /^RID-(\d+)$/;

export interface PlaceholderContext {
  now: dayjs.Dayjs;
  random: () => number;
}

export function sanitizeFileNameSegment(value: string): string {
  return value.replace(/[<>:"/\\|?*]/g, "-");
}

export function generateRid(length: number, random: () => number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(random() * chars.length)]!;
  }
  return result;
}

function resolvePlaceholderToken(
  token: string,
  context: PlaceholderContext,
  resolvedRids: Map<string, string>,
): string {
  const ridMatch = token.match(RID_PATTERN);
  if (ridMatch) {
    const key = `[${token}]`;
    const cached = resolvedRids.get(key);
    if (cached) {
      return cached;
    }
    const length = Number.parseInt(ridMatch[1]!, 10);
    const value = generateRid(length, context.random);
    resolvedRids.set(key, value);
    return value;
  }

  return sanitizeFileNameSegment(context.now.format(token));
}

export function resolvePlaceholders(
  input: string,
  context: PlaceholderContext = {
    now: dayjs(),
    random: Math.random,
  },
): string {
  const resolvedRids = new Map<string, string>();
  const dateCache = new Map<string, string>();

  return input.replace(PLACEHOLDER_PATTERN, (_match, token: string) => {
    const ridMatch = token.match(RID_PATTERN);
    if (ridMatch) {
      return resolvePlaceholderToken(token, context, resolvedRids);
    }

    const cacheKey = `[${token}]`;
    const cachedDate = dateCache.get(cacheKey);
    if (cachedDate) {
      return cachedDate;
    }

    const value = resolvePlaceholderToken(token, context, resolvedRids);
    dateCache.set(cacheKey, value);
    return value;
  });
}

export function extensionFromMimeType(mimeType: string): string {
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

export function extensionFromFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    return "png";
  }
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function ensureExtension(pathValue: string, extension: string): string {
  const normalizedExt = extension.startsWith(".")
    ? extension.slice(1)
    : extension;
  const lastSegment = pathValue.split(/[/\\]/).pop() ?? pathValue;
  if (lastSegment.includes(".")) {
    return pathValue;
  }
  return `${pathValue}.${normalizedExt}`;
}
