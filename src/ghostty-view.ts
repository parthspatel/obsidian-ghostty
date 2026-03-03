import { ItemView, WorkspaceLeaf, Platform } from "obsidian";
import type GhosttyPlugin from "./main";
import type { GhosttySettings } from "./settings";
import { getXtermTheme } from "./settings";
import { TerminalSession } from "./terminal";

// xterm.js imports (bundled by esbuild)
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

// xterm CSS loaded as text via esbuild loader
import xtermCss from "@xterm/xterm/css/xterm.css";

export const VIEW_TYPE_GHOSTTY = "ghostty-terminal";

export class GhosttyView extends ItemView {
  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private session: TerminalSession | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private styleEl: HTMLStyleElement | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: GhosttyPlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_GHOSTTY;
  }

  getDisplayText(): string {
    return "Ghostty Terminal";
  }

  getIcon(): string {
    return "terminal";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("ghostty-terminal-container");

    // Inject xterm.js CSS
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = xtermCss;
    document.head.appendChild(this.styleEl);

    // Create toolbar
    const toolbar = container.createDiv({ cls: "ghostty-toolbar" });

    const titleEl = toolbar.createSpan({ cls: "ghostty-toolbar-title" });
    titleEl.textContent = "Ghostty";

    const actions = toolbar.createDiv({ cls: "ghostty-toolbar-actions" });

    const newBtn = actions.createEl("button", {
      cls: "ghostty-toolbar-btn",
      attr: { "aria-label": "New terminal" },
    });
    newBtn.textContent = "+";
    newBtn.addEventListener("click", () => this.restartTerminal());

    const clearBtn = actions.createEl("button", {
      cls: "ghostty-toolbar-btn",
      attr: { "aria-label": "Clear terminal" },
    });
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => this.terminal?.clear());

    // Create terminal container
    const termContainer = container.createDiv({ cls: "ghostty-xterm-container" });

    // Initialize xterm.js
    this.initTerminal(termContainer);
  }

  async onClose(): Promise<void> {
    this.destroyTerminal();

    if (this.styleEl) {
      this.styleEl.remove();
      this.styleEl = null;
    }
  }

  private initTerminal(container: HTMLElement): void {
    const settings = this.plugin.settings;
    const theme = getXtermTheme(settings.theme, this.app);

    this.terminal = new Terminal({
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      scrollback: settings.scrollback,
      cursorStyle: settings.cursorStyle,
      cursorBlink: settings.cursorBlink,
      allowProposedApi: true,
      theme,
      allowTransparency: true,
      convertEol: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(new WebLinksAddon());

    this.terminal.open(container);

    // Fit to container
    requestAnimationFrame(() => {
      this.fitAddon?.fit();
    });

    // Watch for resize
    this.resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        this.fitAddon?.fit();
        if (this.terminal && this.session) {
          this.session.resize(this.terminal.cols, this.terminal.rows);
        }
      });
    });
    this.resizeObserver.observe(container);

    // Write welcome message
    this.terminal.writeln("\x1b[1;36m  Ghostty Terminal for Obsidian\x1b[0m");
    this.terminal.writeln("\x1b[90m  Powered by xterm.js\x1b[0m");
    this.terminal.writeln("");

    // Start shell session
    this.startSession(settings);
  }

  private async startSession(settings: GhosttySettings): Promise<void> {
    const cwd = this.getWorkingDirectory(settings);

    this.session = new TerminalSession(settings, cwd);

    // Pipe terminal output to xterm
    this.session.onData((data) => {
      this.terminal?.write(data);
    });

    // Handle exit
    this.session.onExit((code) => {
      this.terminal?.writeln("");
      this.terminal?.writeln(
        `\x1b[90m[Process exited with code ${code}. Press Enter to restart]\x1b[0m`
      );
      this.session = null;
    });

    // Pipe xterm input to shell
    this.terminal?.onData((data) => {
      if (this.session?.alive) {
        this.session.write(data);
      } else if (data === "\r") {
        // Restart on Enter after exit
        this.restartTerminal();
      }
    });

    try {
      await this.session.start();

      // Sync size after session starts
      if (this.terminal && this.session) {
        this.session.resize(this.terminal.cols, this.terminal.rows);
      }
    } catch (err: any) {
      this.terminal?.writeln(
        `\x1b[31mFailed to start shell: ${err.message}\x1b[0m`
      );
      this.terminal?.writeln(
        "\x1b[90mCheck your shell path in settings.\x1b[0m"
      );
    }
  }

  private restartTerminal(): void {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }

    this.terminal?.clear();
    this.terminal?.writeln("\x1b[1;36m  Restarting terminal...\x1b[0m");
    this.terminal?.writeln("");

    this.startSession(this.plugin.settings);
  }

  private destroyTerminal(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.session) {
      this.session.destroy();
      this.session = null;
    }

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }

    this.fitAddon = null;
  }

  private getWorkingDirectory(settings: GhosttySettings): string {
    switch (settings.workingDirectory) {
      case "vault": {
        const adapter = this.app.vault.adapter as any;
        return adapter.basePath || process.env.HOME || "/";
      }
      case "home":
        return process.env.HOME || (Platform.isWin ? process.env.USERPROFILE || "C:\\" : "/");
      case "custom":
        return settings.customWorkingDirectory || process.env.HOME || "/";
      default:
        return process.env.HOME || "/";
    }
  }

  /**
   * Apply updated settings to the running terminal.
   */
  applySettings(): void {
    if (!this.terminal) return;

    const settings = this.plugin.settings;
    const theme = getXtermTheme(settings.theme, this.app);

    this.terminal.options.fontFamily = settings.fontFamily;
    this.terminal.options.fontSize = settings.fontSize;
    this.terminal.options.cursorStyle = settings.cursorStyle;
    this.terminal.options.cursorBlink = settings.cursorBlink;
    this.terminal.options.scrollback = settings.scrollback;
    this.terminal.options.theme = theme;

    requestAnimationFrame(() => {
      this.fitAddon?.fit();
    });
  }
}
