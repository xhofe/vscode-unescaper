# Unescape

<a href="https://marketplace.visualstudio.com/items?itemName=xhofe.unescape" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/xhofe.unescape.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863" alt="Made with reactive-vscode" /></a>

A VS Code extension to preview unescaped strings. Perfect for working with JSON, log files, or any text containing escape sequences.

## Features

- **Unescape Preview**: Convert escape sequences to their actual characters and preview in a new tab
- **Unescape Preview (JSON)**: Unescape and format as pretty-printed JSON
- **Smart String Detection**: Automatically extracts string at cursor position when no text is selected
- **Multi-language Support**: Works with any text file, supports multiple quote styles
- **i18n**: English and Chinese localization

## Usage

### Method 1: Select Text

1. Select any text containing escape sequences
2. Right-click to open the context menu
3. Choose **Unescape Preview** or **Unescape Preview (JSON)**

### Method 2: Cursor Position (No Selection)

1. Place your cursor inside a string literal (between quotes)
2. Right-click to open the context menu
3. Choose **Unescape Preview** or **Unescape Preview (JSON)**

The extension will automatically detect and extract the string at your cursor position.

## Supported Escape Sequences

| Escape | Character |
|--------|-----------|
| `\n` | Newline |
| `\t` | Tab |
| `\r` | Carriage Return |
| `\\` | Backslash |
| `\"` | Double Quote |
| `\'` | Single Quote |
| `\b` | Backspace |
| `\f` | Form Feed |
| `\v` | Vertical Tab |
| `\0` | Null |
| `\uXXXX` | Unicode (e.g., `\u0048` → `H`) |
| `\xXX` | Hexadecimal (e.g., `\x48` → `H`) |

## Supported Quote Styles

The smart string detection supports various quote styles used in different programming languages:

| Quote Style | Example | Languages |
|-------------|---------|-----------|
| Double quotes | `"hello"` | JSON, JavaScript, Python, Java, C/C++, Go, etc. |
| Single quotes | `'hello'` | JavaScript, Python, Shell, Ruby, etc. |
| Backticks | `` `hello` `` | JavaScript (template literals), Shell |
| Triple double quotes | `"""hello"""` | Python docstrings |
| Triple single quotes | `'''hello'''` | Python docstrings |
| Python raw strings | `r"hello\n"` | Python (no escape processing) |
| Python f-strings | `f"hello {name}"` | Python (formatted strings) |
| Python byte strings | `b"hello"` | Python |
| C# verbatim strings | `@"hello\nworld"` | C# (no escape processing) |
| Rust raw strings | `r#"hello"#` | Rust (no escape processing) |

## Keyboard Shortcuts

| Command | Windows/Linux | macOS |
|---------|---------------|-------|
| Unescape Preview | `Ctrl+Alt+U` | `Cmd+Alt+U` |
| Unescape Preview (JSON) | `Ctrl+Alt+J` | `Cmd+Alt+J` |

## Example

Given a JSON string value:

```
{"message": "Hello\\nWorld\\t!"}
```

**Unescape Preview** produces:

```
Hello
World	!
```

**Unescape Preview (JSON)** with input `{\"name\":\"Alice\",\"age\":30}` produces:

```json
{
  "name": "Alice",
  "age": 30
}
```

## Commands

<!-- commands -->

| Command                | Title                        |
| ---------------------- | ---------------------------- |
| `unescape.preview`     | %unescape.preview.title%     |
| `unescape.previewJson` | %unescape.previewJson.title% |

<!-- commands -->

## Configurations

<!-- configs -->

**No data**

<!-- configs -->

## Requirements

- VS Code 1.97.0 or higher

## License

[MIT](./LICENSE.md) License © 2025 [Andy Hsu](https://github.com/xhofe)
