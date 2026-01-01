import { useCommand, useDisposable } from 'reactive-vscode'
import { l10n, languages, Uri, window, workspace } from 'vscode'
import { config } from '../config'
import { extractStringAtPosition } from '../services/string-extractor'
import { unescape } from '../unescape'

const SCHEME = 'unescape-preview'
let previewCounter = 0
const contentMap = new Map<string, string>()

/**
 * Get the text to process from selection or cursor position
 */
function getTextToProcess(): string | null {
  const editor = window.activeTextEditor

  if (!editor) {
    return null
  }

  const { document, selection } = editor

  // If text is selected, use the selection
  if (!selection.isEmpty) {
    return document.getText(selection)
  }

  // Try to extract string at cursor position
  return extractStringAtPosition(document, selection.active)
}

/**
 * Detect the language of the content for syntax highlighting
 */
function detectLanguage(content: string): string | undefined {
  // Try to detect JSON
  const trimmed = content.trim()
  if ((trimmed.startsWith('{') && trimmed.endsWith('}'))
    || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed)
      return 'json'
    }
    catch {
      // Not valid JSON, continue detection
    }
  }

  // Try to detect XML/HTML
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().includes('<html')) {
      return 'html'
    }
    return 'xml'
  }

  // Try to detect JavaScript/TypeScript
  if (/^(function|const|let|var|class|import|export|async|await)\s/.test(trimmed)) {
    return 'javascript'
  }

  // Try to detect SQL
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql'
  }

  // Try to detect Python
  if (/^(def|class|import|from|if|for|while)\s/.test(trimmed)) {
    return 'python'
  }

  return undefined
}

/**
 * Show the processed text in a new virtual document
 */
async function showPreview(content: string, language?: string): Promise<void> {
  // Auto-detect language if not specified
  if (!language) {
    language = detectLanguage(content)
  }

  const ext = language === 'json' ? '.json'
    : language === 'javascript' ? '.js'
    : language === 'typescript' ? '.ts'
    : language === 'python' ? '.py'
    : language === 'xml' ? '.xml'
    : language === 'html' ? '.html'
    : language === 'sql' ? '.sql'
    : ''

  const path = `/preview-${++previewCounter}${ext}`
  contentMap.set(path, content)

  const uri = Uri.parse(`${SCHEME}:${path}`)
  const newDocument = await workspace.openTextDocument(uri)

  // Set language mode if detected and document was created
  if (language && newDocument) {
    await languages.setTextDocumentLanguage(newDocument, language)
  }

  await window.showTextDocument(newDocument, {
    preview: true,
    preserveFocus: false,
  })
}

/**
 * Format text as JSON with indentation
 */
function formatJson(text: string): string {
  try {
    const parsed = JSON.parse(text)
    const indentSize = config.jsonIndentSize ?? 2
    // If indent size is 0, use undefined for compact output
    return JSON.stringify(parsed, null, indentSize === 0 ? undefined : indentSize)
  }
  catch {
    // If parsing fails, return original text with error message
    throw new Error(l10n.t('Invalid JSON format'))
  }
}

/**
 * Register the unescape preview commands
 */
export function useUnescapePreviewCommand(): void {
  // Register content provider for virtual documents
  useDisposable(
    workspace.registerTextDocumentContentProvider(SCHEME, {
      provideTextDocumentContent(uri: Uri): string {
        return contentMap.get(uri.path) ?? ''
      },
    }),
  )

  // Basic unescape preview
  useCommand('unescape.preview', async () => {
    const text = getTextToProcess()

    if (!text) {
      window.showWarningMessage(
        l10n.t('No text selected or found at cursor position'),
      )
      return
    }

    const unescapedText = unescape(text)
    await showPreview(unescapedText)
  })

  // Unescape + JSON format preview
  useCommand('unescape.previewJson', async () => {
    const text = getTextToProcess()

    if (!text) {
      window.showWarningMessage(
        l10n.t('No text selected or found at cursor position'),
      )
      return
    }

    const unescapedText = unescape(text)

    try {
      const formattedJson = formatJson(unescapedText)
      await showPreview(formattedJson, 'json')
    }
    catch (error) {
      window.showErrorMessage(
        error instanceof Error ? error.message : l10n.t('Invalid JSON format'),
      )
    }
  })
}
