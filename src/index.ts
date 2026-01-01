import { defineExtension } from 'reactive-vscode'
import { useUnescapePreviewCommand } from './commands/unescape-preview'
import { useStatusBar } from './services/status-bar'

const { activate, deactivate } = defineExtension(() => {
  // Register commands
  useUnescapePreviewCommand()

  // Setup status bar
  useStatusBar()
})

export { activate, deactivate }
