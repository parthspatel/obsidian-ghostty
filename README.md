# Obsidian Ghostty

A Ghostty-inspired terminal plugin for [Obsidian](https://obsidian.md). Embeds a fully functional terminal emulator in the right side panel, powered by [xterm.js](https://xtermjs.org/) and [node-pty](https://github.com/microsoft/node-pty).

## Features

- **Side Panel Terminal**: Opens a terminal directly in the Obsidian right side panel
- **Ghostty-Inspired Themes**: Includes dark and light color themes inspired by the [Ghostty](https://ghostty.org/) terminal emulator
- **Configurable Shell**: Use your default system shell, or specify a custom shell path (e.g., `zsh`, `bash`, `fish`)
- **Claude Code Integration Ready**: Designed to be easily adapted for running [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and other CLI tools directly within Obsidian
- **Full Terminal Emulation**: Supports colors, cursor styles, scrollback, web links, and more
- **Auto-Resize**: Terminal automatically adjusts to panel size changes
- **Customizable Appearance**: Configure font family, font size, cursor style, scrollback buffer, and colors

## Installation

### From Obsidian Community Plugins

1. Open Obsidian **Settings** → **Community Plugins**
2. Click **Browse** and search for "Ghostty Terminal"
3. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/parthspatel/obsidian-ghostty/releases) page
2. Extract the files into your vault's `.obsidian/plugins/obsidian-ghostty/` directory
3. Reload Obsidian and enable the plugin in **Settings** → **Community Plugins**

### Prerequisites

This plugin requires **node-pty** to be available in the Obsidian/Electron runtime. Most desktop installations of Obsidian support this out of the box.

## Usage

### Opening the Terminal

- Click the **terminal icon** (⬛) in the left ribbon bar
- Use the command palette: `Ghostty Terminal: Toggle terminal panel`
- Keyboard shortcut: Configure your own in Obsidian's Hotkey settings

### Commands

| Command | Description |
|---------|-------------|
| `Toggle terminal panel` | Open or close the terminal |
| `Open new terminal panel` | Open a new terminal instance |
| `Focus terminal` | Focus the existing terminal (or open one if none exists) |

### Settings

Access settings via **Settings** → **Ghostty Terminal**:

- **Shell path**: Custom shell executable path (leave empty for system default)
- **Shell arguments**: Arguments to pass to the shell (e.g., `--login`)
- **Font family**: Terminal font (default: JetBrains Mono, Fira Code, etc.)
- **Font size**: Adjustable from 8px to 32px
- **Cursor style**: Block, underline, or bar
- **Color theme**: Ghostty Dark, Ghostty Light, or custom colors
- **Scrollback**: Number of lines to keep in history (500–50,000)
- **Open on startup**: Automatically open terminal when Obsidian starts

## Claude Code Integration

This plugin is designed to serve as a foundation for integrating Claude Code into Obsidian. To use Claude Code in the terminal:

1. Install [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (`npm install -g @anthropic-ai/claude-code`)
2. Open the Ghostty terminal in Obsidian
3. Run `claude` in the terminal to start an interactive Claude Code session
4. Claude Code will have access to your vault files for coding assistance

For a dedicated Claude Code integration, you can set the shell path to the Claude Code executable or create a shell script that launches Claude Code directly.

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/parthspatel/obsidian-ghostty.git
cd obsidian-ghostty

# Install dependencies
npm install

# Build for production
npm run build

# Build for development (with watch mode)
npm run dev
```

### Project Structure

```
obsidian-ghostty/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── GhosttyView.ts       # Terminal view component
│   ├── GhosttySettingTab.ts  # Settings UI
│   └── settings.ts           # Settings types and defaults
├── styles.css                # Terminal CSS styles
├── manifest.json             # Obsidian plugin manifest
├── package.json              # Node.js package config
├── tsconfig.json             # TypeScript config
└── esbuild.config.mjs        # Build configuration
```

## License

MIT
