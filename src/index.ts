import { defineExtension } from 'reactive-vscode'
import { useUnescapePreviewCommand } from './commands/unescape-preview'

const { activate, deactivate } = defineExtension(() => {
  // Register commands
  useUnescapePreviewCommand()
})

export { activate, deactivate }
