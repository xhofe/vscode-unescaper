import type { Position, TextDocument } from 'vscode'

/**
 * Interface for extracting strings from documents at a given position
 */
export interface StringExtractor {
  /**
   * Language IDs that this extractor supports
   */
  languageIds: string[]

  /**
   * Extract the string at the given position in the document
   * @param document The text document
   * @param position The cursor position
   * @returns The extracted string (without quotes) or null if not found
   */
  extract: (document: TextDocument, position: Position) => string | null
}

/**
 * Extractor for JSON/JSONL string values
 */
export class JsonStringExtractor implements StringExtractor {
  languageIds = ['json', 'jsonc', 'jsonl']

  extract(document: TextDocument, position: Position): string | null {
    const line = document.lineAt(position.line).text
    const cursorOffset = position.character

    // Find all string literals in the line
    // Match: "..." allowing escaped characters inside
    const stringRegex = /"(?:[^"\\]|\\.)*"/g
    let match: RegExpExecArray | null = stringRegex.exec(line)

    while (match !== null) {
      const start = match.index
      const end = start + match[0].length

      // Check if cursor is within this string
      if (cursorOffset >= start && cursorOffset <= end) {
        // Return the string content without the surrounding quotes
        return match[0].slice(1, -1)
      }

      match = stringRegex.exec(line)
    }

    return null
  }
}

/**
 * Registry of all string extractors
 */
const extractors: StringExtractor[] = [
  new JsonStringExtractor(),
]

/**
 * Extract string at position using the appropriate extractor for the document's language
 */
export function extractStringAtPosition(
  document: TextDocument,
  position: Position,
): string | null {
  const languageId = document.languageId

  for (const extractor of extractors) {
    if (extractor.languageIds.includes(languageId)) {
      const result = extractor.extract(document, position)
      if (result !== null) {
        return result
      }
    }
  }

  return null
}

/**
 * Register a custom string extractor
 */
export function registerExtractor(extractor: StringExtractor): void {
  extractors.push(extractor)
}
