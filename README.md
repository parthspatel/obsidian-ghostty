# Obsidian Ghostty

A Ghostty-themed terminal plugin for Obsidian that embeds a fully interactive terminal in the right side panel. Designed as a foundation for Claude Code integration.

## Features

- **Side panel terminal** — Opens in Obsidian's right sidebar as a proper `ItemView`
- **xterm.js rendering** — Full terminal emulation with colors, cursor movement, and scrollback
- **Ghostty themes** — Dark and light themes inspired by Ghostty's defaults, plus an auto-match Obsidian theme
- **node-pty support** — Full PTY when `node-pty` is available, with `child_process` fallback
- **Configurable** — Shell path, font, font size, cursor style, scrollback, working directory
- **Commands** — Open, close, and toggle the terminal via the command palette
- **Ribbon icon** — Quick access from the sidebar ribbon
- **Auto-restart** — Press Enter to restart a terminated session
- **Live settings** — Changes to font, theme, and cursor apply immediately

## Installation

### From source

```bash
git clone <repo-url>
cd obsidian-ghostty
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into your vault's `.obsidian/plugins/obsidian-ghostty/` directory.

### For full PTY support (optional)

Install `node-pty` for proper terminal emulation (cursor positioning, interactive programs):

```bash
npm install node-pty
```

Without `node-pty`, the plugin falls back to `child_process.spawn` which works for most CLI tools including Claude Code.

## Usage

1. Open the command palette (`Ctrl/Cmd + P`)
2. Search for "Ghostty"
3. Select **Open terminal in side panel**

Or click the terminal icon in the ribbon.

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Shell path | Path to shell executable | System default |
| Font family | Terminal font | JetBrains Mono, Menlo, Monaco... |
| Font size | Font size in px | 14 |
| Scrollback | Lines of scrollback | 5000 |
| Cursor style | Block, underline, or bar | Block |
| Cursor blink | Animate cursor | On |
| Theme | Ghostty Dark, Ghostty Light, Match Obsidian | Ghostty Dark |
| Working directory | Vault root, Home, or custom | Vault root |
| Open on startup | Auto-open on launch | Off |

## Adapting for Claude Code

This plugin is structured to be easily adapted for Claude Code integration. Key extension points:

1. **`TerminalSession`** (`src/terminal.ts`) — Modify `getShell()` to launch `claude` instead of a shell
2. **`GhosttyView`** (`src/ghostty-view.ts`) — Add Claude-specific UI elements (model selector, context display)
3. **`GhosttySettings`** (`src/settings.ts`) — Add Claude API key, model preferences, etc.

Example: to auto-launch Claude Code, set the shell path in settings to `claude` or modify `TerminalSession.getShell()`.

## Architecture

```
src/
├── main.ts           Plugin class — registers view, commands, settings
├── ghostty-view.ts   ItemView subclass — xterm.js terminal in side panel
├── terminal.ts       Terminal session — PTY/process management
├── settings.ts       Settings interface, defaults, and settings tab
└── declarations.d.ts TypeScript declarations for CSS imports
```

## Development

```bash
npm run dev    # Watch mode with esbuild
npm run build  # Production build
```

## License

MIT
