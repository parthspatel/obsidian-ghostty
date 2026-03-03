import { Platform } from "obsidian";
import type { GhosttySettings } from "./settings";

/**
 * Wraps a shell process (via node-pty or child_process fallback)
 * and provides a unified interface for the terminal view.
 */
export class TerminalSession {
  private process: any;
  private usePty: boolean = false;
  private onDataCallbacks: ((data: string) => void)[] = [];
  private onExitCallbacks: ((code: number) => void)[] = [];
  private _alive: boolean = false;

  get alive(): boolean {
    return this._alive;
  }

  constructor(
    private settings: GhosttySettings,
    private cwd: string
  ) {}

  async start(): Promise<void> {
    const shell = this.getShell();
    const env = this.buildEnv();

    // Try node-pty first for full PTY support
    try {
      const pty = this.requireNodePty();
      if (pty) {
        this.process = pty.spawn(shell, [], {
          name: "xterm-256color",
          cols: 80,
          rows: 24,
          cwd: this.cwd,
          env,
        });

        this.usePty = true;
        this._alive = true;

        this.process.onData((data: string) => {
          this.onDataCallbacks.forEach((cb) => cb(data));
        });

        this.process.onExit(({ exitCode }: { exitCode: number }) => {
          this._alive = false;
          this.onExitCallbacks.forEach((cb) => cb(exitCode));
        });

        return;
      }
    } catch {
      // node-pty not available, fall through to fallback
    }

    // Fallback: child_process.spawn
    const cp = require("child_process");
    const args = this.getShellArgs(shell);

    this.process = cp.spawn(shell, args, {
      cwd: this.cwd,
      env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.usePty = false;
    this._alive = true;

    this.process.stdout?.on("data", (data: Buffer) => {
      this.onDataCallbacks.forEach((cb) => cb(data.toString()));
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      this.onDataCallbacks.forEach((cb) => cb(data.toString()));
    });

    this.process.on("exit", (code: number | null) => {
      this._alive = false;
      this.onExitCallbacks.forEach((cb) => cb(code ?? 0));
    });

    this.process.on("error", (err: Error) => {
      this._alive = false;
      this.onDataCallbacks.forEach((cb) =>
        cb(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`)
      );
      this.onExitCallbacks.forEach((cb) => cb(1));
    });
  }

  write(data: string): void {
    if (!this._alive) return;

    if (this.usePty) {
      this.process.write(data);
    } else {
      this.process.stdin?.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    if (!this._alive) return;

    if (this.usePty && this.process.resize) {
      this.process.resize(cols, rows);
    }
  }

  onData(callback: (data: string) => void): void {
    this.onDataCallbacks.push(callback);
  }

  onExit(callback: (code: number) => void): void {
    this.onExitCallbacks.push(callback);
  }

  destroy(): void {
    if (!this._alive) return;
    this._alive = false;

    try {
      if (this.usePty) {
        this.process.kill();
      } else {
        this.process.kill("SIGTERM");
        // Force kill after 2 seconds if still alive
        setTimeout(() => {
          try {
            this.process.kill("SIGKILL");
          } catch {
            // Already dead
          }
        }, 2000);
      }
    } catch {
      // Process already dead
    }

    this.onDataCallbacks = [];
    this.onExitCallbacks = [];
  }

  private getShell(): string {
    if (this.settings.shellPath) {
      return this.settings.shellPath;
    }

    if (Platform.isMacOS || Platform.isLinux) {
      return process.env.SHELL || "/bin/bash";
    }

    return process.env.COMSPEC || "cmd.exe";
  }

  private getShellArgs(shell: string): string[] {
    // For interactive shell via child_process fallback
    if (shell.endsWith("bash") || shell.endsWith("zsh") || shell.endsWith("fish")) {
      return ["-i", "-l"];
    }
    return [];
  }

  private buildEnv(): Record<string, string> {
    return {
      ...process.env as Record<string, string>,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      TERM_PROGRAM: "obsidian-ghostty",
      LANG: process.env.LANG || "en_US.UTF-8",
    };
  }

  private requireNodePty(): any {
    try {
      // Try to require node-pty from various locations
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("node-pty");
    } catch {
      return null;
    }
  }
}
