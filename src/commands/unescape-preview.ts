import { useCommand, useDisposable } from 'reactive-vscode'
import { l10n, Uri, window, workspace } from 'vscode'
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
 * Show the processed text in a new virtual document
 */
async function showPreview(content: string, language?: string): Promise<void> {
  const path = `/preview-${++previewCounter}${language === 'json' ? '.json' : ''}`
  contentMap.set(path, content)

  const uri = Uri.parse(`${SCHEME}:${path}`)
  const newDocument = await workspace.openTextDocument(uri)

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
    return JSON.stringify(parsed, null, 2)
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
