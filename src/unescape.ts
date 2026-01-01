/**
 * Unescape a string by converting escape sequences to their actual characters
 */
export function unescape(text: string): string {
  const escapeMap: Record<string, string> = {
    'n': '\n',
    't': '\t',
    'r': '\r',
    'b': '\b',
    'f': '\f',
    'v': '\v',
    '\\': '\\',
    '"': '"',
    '\'': '\'',
    '0': '\0',
  }

  return text.replace(
    /\\(u[\da-fA-F]{4}|x[\da-fA-F]{2}|[nrtbfv\\'"0])/g,
    (match, captured: string) => {
      // Handle Unicode escape: \uXXXX
      if (captured.startsWith('u')) {
        const codePoint = Number.parseInt(captured.slice(1), 16)
        return String.fromCharCode(codePoint)
      }

      // Handle hex escape: \xXX
      if (captured.startsWith('x')) {
        const codePoint = Number.parseInt(captured.slice(1), 16)
        return String.fromCharCode(codePoint)
      }

      // Handle simple escape sequences
      return escapeMap[captured] ?? match
    },
  )
}
