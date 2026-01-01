import { describe, expect, it } from 'vitest'
import { extractStringAtPosition, extractStringWithDetails } from '../src/services/string-extractor'

// Mock TextDocument for testing
function createMockDocument(content: string) {
  const lines = content.split('\n')
  let offset = 0
  const lineOffsets = lines.map((line) => {
    const start = offset
    offset += line.length + 1 // +1 for newline
    return start
  })

  return {
    getText: () => content,
    lineAt: (line: number) => ({ text: lines[line] }),
    positionAt: (offset: number) => {
      let line = 0
      while (line < lineOffsets.length - 1 && lineOffsets[line + 1] <= offset) {
        line++
      }
      return { line, character: offset - lineOffsets[line] }
    },
  }
}

function createPosition(line: number, character: number) {
  return { line, character }
}

describe('extractStringAtPosition', () => {
  describe('double quotes', () => {
    it('should extract string when cursor is inside', () => {
      const doc = createMockDocument('const x = "hello world"')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello world')
    })

    it('should extract string when cursor is at opening quote', () => {
      const doc = createMockDocument('const x = "hello"')
      const pos = createPosition(0, 10)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello')
    })

    it('should extract string when cursor is at closing quote', () => {
      const doc = createMockDocument('const x = "hello"')
      const pos = createPosition(0, 16)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello')
    })

    it('should handle escaped quotes', () => {
      const doc = createMockDocument('const x = "say \\"hello\\""')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('say \\"hello\\"')
    })

    it('should handle escaped backslash before quote', () => {
      const doc = createMockDocument('const x = "path\\\\"')
      const pos = createPosition(0, 12)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('path\\\\')
    })

    it('should return null when cursor is outside string', () => {
      const doc = createMockDocument('const x = "hello"')
      const pos = createPosition(0, 5)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBeNull()
    })

    it('should extract correct string when multiple strings on line', () => {
      const doc = createMockDocument('const a = "first", b = "second"')
      const pos = createPosition(0, 26)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('second')
    })
  })

  describe('single quotes', () => {
    it('should extract single-quoted string', () => {
      const doc = createMockDocument('const x = \'hello world\'')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello world')
    })

    it('should handle escaped single quotes', () => {
      const doc = createMockDocument('const x = \'it\\\'s working\'')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('it\\\'s working')
    })
  })

  describe('backticks (template literals)', () => {
    it('should extract template literal', () => {
      const doc = createMockDocument('const x = `hello world`')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello world')
    })

    it('should handle multi-line template literal', () => {
      const doc = createMockDocument('const x = `hello\nworld`')
      const pos = createPosition(0, 12)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello\nworld')
    })

    it('should extract from second line of multi-line template', () => {
      const doc = createMockDocument('const x = `hello\nworld`')
      const pos = createPosition(1, 2)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello\nworld')
    })
  })

  describe('triple double quotes (Python docstrings)', () => {
    it('should extract triple-quoted string', () => {
      const doc = createMockDocument('x = """hello world"""')
      const pos = createPosition(0, 10)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello world')
    })

    it('should handle multi-line triple-quoted string', () => {
      const doc = createMockDocument('x = """hello\nworld"""')
      const pos = createPosition(0, 6)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello\nworld')
    })

    it('should extract from second line of triple-quoted string', () => {
      const doc = createMockDocument('x = """hello\nworld"""')
      const pos = createPosition(1, 2)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello\nworld')
    })

    it('should not confuse with regular double quote inside triple quotes', () => {
      const doc = createMockDocument('x = """say "hello" world"""')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('say "hello" world')
    })
  })

  describe('triple single quotes', () => {
    it('should extract triple single-quoted string', () => {
      const doc = createMockDocument('x = \'\'\'hello world\'\'\'')
      const pos = createPosition(0, 10)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello world')
    })
  })

  describe('json format', () => {
    it('should work with JSON object', () => {
      const doc = createMockDocument('{"key": "value"}')
      const pos = createPosition(0, 10)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('value')
    })

    it('should extract key string in JSON', () => {
      const doc = createMockDocument('{"key": "value"}')
      const pos = createPosition(0, 3)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('key')
    })

    it('should handle escaped characters in JSON', () => {
      const doc = createMockDocument('{"text": "hello\\nworld"}')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('hello\\nworld')
    })

    it('should handle unicode escapes in JSON', () => {
      const doc = createMockDocument('{"text": "\\u0048\\u0065\\u006c\\u006c\\u006f"}')
      const pos = createPosition(0, 15)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('\\u0048\\u0065\\u006c\\u006c\\u006f')
    })
  })

  describe('empty strings', () => {
    it('should handle empty double-quoted string', () => {
      const doc = createMockDocument('const x = ""')
      const pos = createPosition(0, 11)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('')
    })

    it('should handle empty single-quoted string', () => {
      const doc = createMockDocument('const x = \'\'')
      const pos = createPosition(0, 11)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('')
    })
  })

  describe('edge cases', () => {
    it('should return null for empty document', () => {
      const doc = createMockDocument('')
      const pos = createPosition(0, 0)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBeNull()
    })

    it('should return null when no strings on line', () => {
      const doc = createMockDocument('const x = 123')
      const pos = createPosition(0, 5)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBeNull()
    })

    it('should handle string at end of line', () => {
      const doc = createMockDocument('x = "end"')
      const pos = createPosition(0, 6)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('end')
    })

    it('should handle adjacent strings', () => {
      const doc = createMockDocument('"first""second"')
      const pos = createPosition(0, 9)

      const result = extractStringAtPosition(doc as any, pos as any)
      expect(result).toBe('second')
    })
  })
})

describe('extractStringWithDetails', () => {
  it('should return full details including quote style', () => {
    const doc = createMockDocument('const x = "hello"')
    const pos = createPosition(0, 12)

    const result = extractStringWithDetails(doc as any, pos as any)
    expect(result).not.toBeNull()
    expect(result!.content).toBe('hello')
    expect(result!.quoteStyle.open).toBe('"')
    expect(result!.quoteStyle.close).toBe('"')
    expect(result!.start).toEqual({ line: 0, character: 10 })
    expect(result!.end).toEqual({ line: 0, character: 17 })
  })

  it('should identify triple quote style', () => {
    const doc = createMockDocument('x = """test"""')
    const pos = createPosition(0, 7)

    const result = extractStringWithDetails(doc as any, pos as any)
    expect(result).not.toBeNull()
    expect(result!.quoteStyle.open).toBe('"""')
    expect(result!.quoteStyle.multiLine).toBe(true)
  })
})
