export interface TextRange {
  start: number
  end: number
}

/** Find the alt-text substring range inside generated insert text. */
export function findAltTextSelection(insertText: string, languageId: string): TextRange | undefined {
  if (languageId === 'markdown') {
    const markdownImage = insertText.match(/!\[([^\]]*)\]/)
    if (markdownImage?.index !== undefined) {
      const start = markdownImage.index + 2
      return { start, end: start + markdownImage[1]!.length }
    }

    const markdownLink = insertText.match(/\[([^\]]*)\]\(/)
    if (markdownLink?.index !== undefined) {
      const start = markdownLink.index + 1
      return { start, end: start + markdownLink[1]!.length }
    }
  }

  if (languageId === 'html') {
    const htmlAlt = insertText.match(/alt="([^"]*)"/)
    if (htmlAlt?.index !== undefined) {
      const start = htmlAlt.index + 5
      return { start, end: start + htmlAlt[1]!.length }
    }

    const anchorText = insertText.match(/<a\b[^>]*>([^<]*)<\/a>/i)
    if (anchorText?.index !== undefined) {
      const start = insertText.indexOf('>', anchorText.index) + 1
      return { start, end: start + anchorText[1]!.length }
    }
  }

  return undefined
}
