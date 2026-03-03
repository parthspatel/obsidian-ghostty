import { ItemView, WorkspaceLeaf } from "obsidian";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import type { GhosttySettings } from "./settings";
import { GHOSTTY_THEMES } from "./settings";

export const VIEW_TYPE_GHOSTTY = "ghostty-terminal-view";

export class GhosttyView extends ItemView {
	private terminal: Terminal | null = null;
	private fitAddon: FitAddon | null = null;
	private ptyProcess: ReturnType<typeof import("node-pty").spawn> | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private settings: GhosttySettings;
	private terminalEl: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf, settings: GhosttySettings) {
		super(leaf);
		this.settings = settings;
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
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("ghostty-terminal-container");

		this.terminalEl = container.createDiv({ cls: "ghostty-terminal" });

		const theme = this.getTheme();

		this.terminal = new Terminal({
			fontFamily: this.settings.fontFamily,
			fontSize: this.settings.fontSize,
			cursorStyle: this.settings.cursorStyle,
			cursorBlink: this.settings.cursorBlink,
			scrollback: this.settings.scrollback,
			allowProposedApi: true,
			theme: theme,
		});

		this.fitAddon = new FitAddon();
		this.terminal.loadAddon(this.fitAddon);
		this.terminal.loadAddon(new WebLinksAddon());

		this.terminal.open(this.terminalEl);

		// Fit terminal after a short delay to ensure DOM is ready
		setTimeout(() => {
			this.fitTerminal();
		}, 100);

		// Watch for container resizes
		this.resizeObserver = new ResizeObserver(() => {
			this.fitTerminal();
		});
		this.resizeObserver.observe(this.terminalEl);

		// Spawn PTY process
		this.spawnPty();
	}

	private getTheme(): Record<string, string> {
		if (this.settings.theme === "custom") {
			return {
				background: this.settings.customBackground,
				foreground: this.settings.customForeground,
				cursor: this.settings.customCursor,
			};
		}
		return GHOSTTY_THEMES[this.settings.theme] ?? GHOSTTY_THEMES["ghostty-dark"];
	}

	private getShellPath(): string {
		if (this.settings.shellPath) {
			return this.settings.shellPath;
		}
		// Default to system shell
		if (process.platform === "win32") {
			return process.env.COMSPEC ?? "cmd.exe";
		}
		return process.env.SHELL ?? "/bin/bash";
	}

	private getShellArgs(): string[] {
		if (this.settings.shellArgs) {
			return this.settings.shellArgs.split(" ").filter((a) => a.length > 0);
		}
		return [];
	}

	private spawnPty(): void {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const pty = require("node-pty");
			const shell = this.getShellPath();
			const args = this.getShellArgs();

			const cols = this.terminal?.cols ?? 80;
			const rows = this.terminal?.rows ?? 24;

			// Use the vault path as the working directory
			const vaultPath =
				(this.app.vault.adapter as { getBasePath?: () => string }).getBasePath?.() ?? process.env.HOME ?? "/";

			this.ptyProcess = pty.spawn(shell, args, {
				name: "xterm-256color",
				cols: cols,
				rows: rows,
				cwd: vaultPath,
				env: Object.assign({}, process.env, {
					TERM: "xterm-256color",
					COLORTERM: "truecolor",
				}),
			});

			// Connect PTY output to terminal
			this.ptyProcess?.onData((data: string) => {
				this.terminal?.write(data);
			});

			// Connect terminal input to PTY
			this.terminal?.onData((data: string) => {
				this.ptyProcess?.write(data);
			});

			// Handle PTY exit
			this.ptyProcess?.onExit(({ exitCode }: { exitCode: number }) => {
				this.terminal?.write(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m\r\n`);
			});
		} catch (e) {
			console.error("Ghostty: Failed to spawn PTY process:", e);
			this.terminal?.write(
				"\x1b[31mFailed to start terminal.\x1b[0m\r\n\r\n" +
					"The node-pty module is required for terminal functionality.\r\n" +
					"Please ensure node-pty is installed and compatible with your\r\n" +
					"Obsidian/Electron version.\r\n\r\n" +
					`Error: ${e instanceof Error ? e.message : String(e)}\r\n`
			);
		}
	}

	private fitTerminal(): void {
		if (this.fitAddon && this.terminal) {
			try {
				this.fitAddon.fit();
				if (this.ptyProcess) {
					this.ptyProcess.resize(this.terminal.cols, this.terminal.rows);
				}
			} catch {
				// Ignore fit errors during initialization
			}
		}
	}

	updateSettings(settings: GhosttySettings): void {
		this.settings = settings;
		if (this.terminal) {
			this.terminal.options.fontFamily = settings.fontFamily;
			this.terminal.options.fontSize = settings.fontSize;
			this.terminal.options.cursorStyle = settings.cursorStyle;
			this.terminal.options.cursorBlink = settings.cursorBlink;
			this.terminal.options.scrollback = settings.scrollback;
			this.terminal.options.theme = this.getTheme();
			this.fitTerminal();
		}
	}

	focus(): void {
		this.terminal?.focus();
	}

	async onClose(): Promise<void> {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
		if (this.ptyProcess) {
			this.ptyProcess.kill();
			this.ptyProcess = null;
		}
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
		}
		this.fitAddon = null;
		this.terminalEl = null;
	}
}
