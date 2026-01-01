/**
 * Count escape sequences in a string
 */
export interface EscapeStats {
  /** Total number of escape sequences found */
  total: number
  /** Breakdown by escape type */
  breakdown: Record<string, number>
}

/**
 * Count all escape sequences in the given text
 */
export function countEscapeSequences(text: string): EscapeStats {
  const breakdown: Record<string, number> = {}
  let total = 0

  // Match all escape sequences
  const regex = /\\(u[\da-fA-F]{4}|x[\da-fA-F]{2}|[nrtbfv\\'"0])/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const escapeName = match[1]
    const displayName = escapeName.startsWith('u') ? '\\u'
      : escapeName.startsWith('x') ? '\\x'
      : `\\${escapeName}`

    breakdown[displayName] = (breakdown[displayName] || 0) + 1
    total++
  }

  return { total, breakdown }
}

/**
 * Format escape stats as a readable string
 */
export function formatEscapeStats(stats: EscapeStats): string {
  if (stats.total === 0) {
    return 'No escape sequences'
  }

  const parts: string[] = []
  for (const [name, count] of Object.entries(stats.breakdown)) {
    parts.push(`${name}:${count}`)
  }

  return `${stats.total} escape seq (${parts.join(', ')})`
}
