import { useCommand, useDisposable } from 'reactive-vscode'
import { l10n, Uri, window, workspace } from 'vscode'
import { extractStringAtPosition } from '../services/string-extractor'
import { unescape } from '../unescape'

const SCHEME = 'unescape-preview'
let previewCounter = 0
const contentMap = new Map<string, string>()

/**
 * Register the unescape preview command
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

  useCommand('unescape.preview', async () => {
    const editor = window.activeTextEditor

    if (!editor) {
      return
    }

    const { document, selection } = editor
    let text: string | null = null

    // If text is selected, use the selection
    if (!selection.isEmpty) {
      text = document.getText(selection)
    }
    else {
      // Try to extract string at cursor position
      text = extractStringAtPosition(document, selection.active)
    }

    if (!text) {
      window.showWarningMessage(
        l10n.t('No text selected or found at cursor position'),
      )
      return
    }

    // Unescape the text
    const unescapedText = unescape(text)

    // Create a virtual document URI
    const path = `/preview-${++previewCounter}`
    contentMap.set(path, unescapedText)

    const uri = Uri.parse(`${SCHEME}:${path}`)
    const newDocument = await workspace.openTextDocument(uri)

    await window.showTextDocument(newDocument, {
      preview: true,
      preserveFocus: false,
    })
  })
}
