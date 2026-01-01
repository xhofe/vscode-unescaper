import type { Position, TextDocument } from 'vscode'

/**
 * Quote style configuration
 */
interface QuoteStyle {
  /** Opening quote character(s) */
  open: string
  /** Closing quote character(s) */
  close: string
  /** Whether this quote style supports escaping with backslash */
  supportsEscape: boolean
  /** Whether this is a multi-line quote style (e.g., triple quotes) */
  multiLine: boolean
  /** Optional prefix (e.g., 'r' for Python raw strings, '@' for C# verbatim) */
  prefix?: string
  /** Whether the prefix disables escape sequences */
  prefixDisablesEscape?: boolean
}

/**
 * Common quote styles used in various programming languages
 */
const QUOTE_STYLES: QuoteStyle[] = [
  // Python raw strings (no escape processing)
  { open: '"', close: '"', supportsEscape: false, multiLine: false, prefix: 'r', prefixDisablesEscape: true },
  { open: '\'', close: '\'', supportsEscape: false, multiLine: false, prefix: 'r', prefixDisablesEscape: true },
  { open: '"""', close: '"""', supportsEscape: false, multiLine: true, prefix: 'r', prefixDisablesEscape: true },
  { open: '\'\'\'', close: '\'\'\'', supportsEscape: false, multiLine: true, prefix: 'r', prefixDisablesEscape: true },

  // C# verbatim strings (no escape processing except for double quotes)
  { open: '"', close: '"', supportsEscape: false, multiLine: true, prefix: '@', prefixDisablesEscape: true },

  // Rust raw strings (with multiple # for flexibility)
  { open: '"', close: '"', supportsEscape: false, multiLine: true, prefix: 'r#', prefixDisablesEscape: true },
  { open: '"', close: '"', supportsEscape: false, multiLine: true, prefix: 'r##', prefixDisablesEscape: true },
  { open: '"', close: '"', supportsEscape: false, multiLine: true, prefix: 'r###', prefixDisablesEscape: true },

  // Python byte strings
  { open: '"', close: '"', supportsEscape: true, multiLine: false, prefix: 'b' },
  { open: '\'', close: '\'', supportsEscape: true, multiLine: false, prefix: 'b' },

  // Python f-strings (formatted strings)
  { open: '"', close: '"', supportsEscape: true, multiLine: false, prefix: 'f' },
  { open: '\'', close: '\'', supportsEscape: true, multiLine: false, prefix: 'f' },

  // Triple quotes (must be checked before single quotes)
  { open: '"""', close: '"""', supportsEscape: true, multiLine: true },
  { open: '\'\'\'', close: '\'\'\'', supportsEscape: true, multiLine: true },

  // Backtick / template literals
  { open: '`', close: '`', supportsEscape: true, multiLine: true },

  // Standard quotes
  { open: '"', close: '"', supportsEscape: true, multiLine: false },
  { open: '\'', close: '\'', supportsEscape: true, multiLine: false },
]

/**
 * Result of string extraction
 */
interface ExtractResult {
  /** The extracted string content (without quotes) */
  content: string
  /** Start position (line, character) */
  start: { line: number, character: number }
  /** End position (line, character) */
  end: { line: number, character: number }
  /** The quote style used */
  quoteStyle: QuoteStyle
}

/**
 * Check if a position in text is escaped (preceded by odd number of backslashes)
 */
function isEscaped(text: string, position: number): boolean {
  let backslashCount = 0
  let i = position - 1
  while (i >= 0 && text[i] === '\\') {
    backslashCount++
    i--
  }
  return backslashCount % 2 === 1
}

/**
 * Find string at position for single-line quote styles
 */
function findSingleLineString(
  line: string,
  lineNumber: number,
  cursorChar: number,
  quoteStyle: QuoteStyle,
): ExtractResult | null {
  const { open, close, supportsEscape, prefix } = quoteStyle

  let i = 0
  while (i < line.length) {
    // Check for optional prefix
    let prefixStart = i
    let prefixLength = 0
    if (prefix) {
      if (line.substring(i, i + prefix.length) === prefix) {
        prefixLength = prefix.length
        i += prefix.length
      }
      else {
        // This quote style requires a prefix but it's not present, skip
        i++
        continue
      }
    }

    // Look for opening quote
    if (line.substring(i, i + open.length) === open) {
      const startChar = prefixLength > 0 ? prefixStart : i
      i += open.length
      const contentStart = i

      // Find closing quote
      while (i < line.length) {
        if (line.substring(i, i + close.length) === close) {
          // Check if escaped
          if (supportsEscape && isEscaped(line, i)) {
            i++
            continue
          }

          const contentEnd = i
          const endChar = i + close.length

          // Check if cursor is within this string (inclusive of quotes and prefix)
          if (cursorChar >= startChar && cursorChar < endChar) {
            return {
              content: line.substring(contentStart, contentEnd),
              start: { line: lineNumber, character: startChar },
              end: { line: lineNumber, character: endChar },
              quoteStyle,
            }
          }

          i = endChar
          break
        }
        i++
      }
    }
    else {
      i++
    }
  }

  return null
}

/**
 * Find string at position for multi-line quote styles
 */
function findMultiLineString(
  document: TextDocument,
  cursorLine: number,
  cursorChar: number,
  quoteStyle: QuoteStyle,
): ExtractResult | null {
  const { open, close, supportsEscape, prefix } = quoteStyle

  // Get full text and calculate cursor offset
  const fullText = document.getText()
  let cursorOffset = 0
  for (let i = 0; i < cursorLine; i++) {
    cursorOffset += document.lineAt(i).text.length + 1 // +1 for newline
  }
  cursorOffset += cursorChar

  let i = 0
  while (i < fullText.length) {
    // Check for optional prefix
    let prefixStart = i
    let prefixLength = 0
    if (prefix) {
      if (fullText.substring(i, i + prefix.length) === prefix) {
        prefixLength = prefix.length
        i += prefix.length
      }
      else {
        // This quote style requires a prefix but it's not present, skip
        i++
        continue
      }
    }

    // Look for opening quote
    if (fullText.substring(i, i + open.length) === open) {
      const startOffset = prefixLength > 0 ? prefixStart : i
      i += open.length
      const contentStart = i

      // For Rust raw strings, find matching closing with same number of #
      let closeToMatch = close
      if (prefix?.startsWith('r#')) {
        const hashCount = (prefix.match(/#/g) || []).length
        closeToMatch = '"' + '#'.repeat(hashCount)
      }

      // Find closing quote
      while (i < fullText.length) {
        if (fullText.substring(i, i + closeToMatch.length) === closeToMatch) {
          // Check if escaped
          if (supportsEscape && isEscaped(fullText, i)) {
            i++
            continue
          }

          const contentEnd = i
          const endOffset = i + closeToMatch.length

          // Check if cursor is within this string
          if (cursorOffset >= startOffset && cursorOffset < endOffset) {
            // Convert offsets back to positions
            const startPos = document.positionAt(startOffset)
            const endPos = document.positionAt(endOffset)

            return {
              content: fullText.substring(contentStart, contentEnd),
              start: { line: startPos.line, character: startPos.character },
              end: { line: endPos.line, character: endPos.character },
              quoteStyle,
            }
          }

          i = endOffset
          break
        }
        i++
      }
    }
    else {
      i++
    }
  }

  return null
}

/**
 * Extract string at the given cursor position from any text document
 * Supports multiple quote styles: "", '', ``, """, '''
 *
 * @param document The text document
 * @param position The cursor position
 * @returns The extracted string content (without quotes) or null if not found
 */
export function extractStringAtPosition(
  document: TextDocument,
  position: Position,
): string | null {
  const line = document.lineAt(position.line).text
  const cursorChar = position.character

  // Try each quote style, starting with longer ones (triple quotes first)
  for (const quoteStyle of QUOTE_STYLES) {
    let result: ExtractResult | null = null

    if (quoteStyle.multiLine) {
      // For multi-line strings, we need to search the entire document
      result = findMultiLineString(document, position.line, cursorChar, quoteStyle)
    }
    else {
      // For single-line strings, just search the current line
      result = findSingleLineString(line, position.line, cursorChar, quoteStyle)
    }

    if (result) {
      return result.content
    }
  }

  return null
}

/**
 * Extract string with full details (position, quote style, etc.)
 */
export function extractStringWithDetails(
  document: TextDocument,
  position: Position,
): ExtractResult | null {
  const line = document.lineAt(position.line).text
  const cursorChar = position.character

  for (const quoteStyle of QUOTE_STYLES) {
    let result: ExtractResult | null = null

    if (quoteStyle.multiLine) {
      result = findMultiLineString(document, position.line, cursorChar, quoteStyle)
    }
    else {
      result = findSingleLineString(line, position.line, cursorChar, quoteStyle)
    }

    if (result) {
      return result
    }
  }

  return null
}
