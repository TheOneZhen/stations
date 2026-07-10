export interface AltTextSelection {
  start: number;
  end: number;
}

export function findAltTextSelection(
  insertText: string,
  languageId: string,
): AltTextSelection | undefined {
  if (languageId === "markdown") {
    const prefix = "![";
    const start = insertText.indexOf(prefix);
    if (start === -1) {
      return undefined;
    }
    const altStart = start + prefix.length;
    const altEnd = insertText.indexOf("](", altStart);
    if (altEnd === -1) {
      return undefined;
    }
    return { start: altStart, end: altEnd };
  }

  if (languageId === "html") {
    const match = insertText.match(/\balt=(["'])(.*?)\1/i);
    if (!match || match.index === undefined) {
      return undefined;
    }
    const quote = match[1]!;
    const altStart = match.index + "alt=".length + quote.length;
    return { start: altStart, end: altStart + match[2]!.length };
  }

  const marker = "altText";
  const markerIndex = insertText.indexOf(marker);
  if (markerIndex === -1) {
    return undefined;
  }
  return {
    start: markerIndex,
    end: markerIndex + marker.length,
  };
}
