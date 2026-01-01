import { computed, useDisposable, watchEffect } from 'reactive-vscode'
import { StatusBarAlignment, window } from 'vscode'
import { config } from '../config'
import { extractStringWithDetails } from './string-extractor'
import { countEscapeSequences, formatEscapeStats } from './escape-counter'

/**
 * Setup status bar item to show string information when cursor is inside a string
 */
export function useStatusBar(): void {
  const statusBarItem = useDisposable(
    window.createStatusBarItem(StatusBarAlignment.Right, 100),
  )

  const activeEditor = computed(() => window.activeTextEditor)
  const selection = computed(() => activeEditor.value?.selection)

  watchEffect(() => {
    // Check if status bar is enabled in config
    if (!config.statusBarEnabled) {
      statusBarItem.hide()
      return
    }

    const editor = activeEditor.value
    if (!editor || !selection.value) {
      statusBarItem.hide()
      return
    }

    // Only show when there's no selection (cursor position only)
    if (!selection.value.isEmpty) {
      statusBarItem.hide()
      return
    }

    const { document } = editor
    const position = selection.value.active

    try {
      // Try to extract string at cursor position
      const result = extractStringWithDetails(document, position)

      if (!result) {
        statusBarItem.hide()
        return
      }

      // Calculate statistics
      const length = result.content.length
      const stats = countEscapeSequences(result.content)

      // Format status bar text
      const parts = [`$(symbol-string) ${length} chars`]
      if (stats.total > 0) {
        parts.push(formatEscapeStats(stats))
      }

      statusBarItem.text = parts.join(' | ')
      statusBarItem.tooltip = 'String information at cursor position\nClick to unescape'
      statusBarItem.command = 'unescape.preview'
      statusBarItem.show()
    }
    catch {
      statusBarItem.hide()
    }
  })
}
