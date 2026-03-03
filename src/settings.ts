import { App, PluginSettingTab, Setting } from "obsidian";
import type GhosttyPlugin from "./main";

export interface GhosttySettings {
  shellPath: string;
  fontFamily: string;
  fontSize: number;
  scrollback: number;
  cursorStyle: "block" | "underline" | "bar";
  cursorBlink: boolean;
  theme: "ghostty-dark" | "ghostty-light" | "obsidian";
  openOnStartup: boolean;
  workingDirectory: "vault" | "home" | "custom";
  customWorkingDirectory: string;
}

export const DEFAULT_SETTINGS: GhosttySettings = {
  shellPath: "",
  fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
  fontSize: 14,
  scrollback: 5000,
  cursorStyle: "block",
  cursorBlink: true,
  theme: "ghostty-dark",
  openOnStartup: false,
  workingDirectory: "vault",
  customWorkingDirectory: "",
};

export const GHOSTTY_THEMES = {
  "ghostty-dark": {
    background: "#282c34",
    foreground: "#c8ccd4",
    cursor: "#528bff",
    cursorAccent: "#282c34",
    selectionBackground: "#3e4451",
    selectionForeground: "#c8ccd4",
    black: "#282c34",
    red: "#e06c75",
    green: "#98c379",
    yellow: "#e5c07b",
    blue: "#61afef",
    magenta: "#c678dd",
    cyan: "#56b6c2",
    white: "#c8ccd4",
    brightBlack: "#545862",
    brightRed: "#e06c75",
    brightGreen: "#98c379",
    brightYellow: "#e5c07b",
    brightBlue: "#61afef",
    brightMagenta: "#c678dd",
    brightCyan: "#56b6c2",
    brightWhite: "#fffefe",
  },
  "ghostty-light": {
    background: "#fafafa",
    foreground: "#383a42",
    cursor: "#526eff",
    cursorAccent: "#fafafa",
    selectionBackground: "#e5e5e6",
    selectionForeground: "#383a42",
    black: "#383a42",
    red: "#e45649",
    green: "#50a14f",
    yellow: "#c18401",
    blue: "#4078f2",
    magenta: "#a626a4",
    cyan: "#0184bc",
    white: "#fafafa",
    brightBlack: "#a0a1a7",
    brightRed: "#e45649",
    brightGreen: "#50a14f",
    brightYellow: "#c18401",
    brightBlue: "#4078f2",
    brightMagenta: "#a626a4",
    brightCyan: "#0184bc",
    brightWhite: "#fafafa",
  },
};

export function getXtermTheme(
  themeName: GhosttySettings["theme"],
  app: App
): Record<string, string> {
  if (themeName === "obsidian") {
    const isDark = document.body.classList.contains("theme-dark");
    return isDark ? GHOSTTY_THEMES["ghostty-dark"] : GHOSTTY_THEMES["ghostty-light"];
  }
  return GHOSTTY_THEMES[themeName];
}

export class GhosttySettingTab extends PluginSettingTab {
  plugin: GhosttyPlugin;

  constructor(app: App, plugin: GhosttyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Ghostty Terminal Settings" });

    new Setting(containerEl)
      .setName("Shell path")
      .setDesc(
        "Path to the shell executable. Leave empty for system default."
      )
      .addText((text) =>
        text
          .setPlaceholder("/bin/zsh or /bin/bash")
          .setValue(this.plugin.settings.shellPath)
          .onChange(async (value) => {
            this.plugin.settings.shellPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Font family")
      .setDesc("Terminal font family.")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.fontFamily)
          .onChange(async (value) => {
            this.plugin.settings.fontFamily = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Font size")
      .setDesc("Terminal font size in pixels.")
      .addSlider((slider) =>
        slider
          .setLimits(8, 32, 1)
          .setValue(this.plugin.settings.fontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.fontSize = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Scrollback")
      .setDesc("Number of scrollback lines.")
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.scrollback))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num > 0) {
              this.plugin.settings.scrollback = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Cursor style")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("block", "Block")
          .addOption("underline", "Underline")
          .addOption("bar", "Bar")
          .setValue(this.plugin.settings.cursorStyle)
          .onChange(async (value) => {
            this.plugin.settings.cursorStyle = value as GhosttySettings["cursorStyle"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Cursor blink")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.cursorBlink)
          .onChange(async (value) => {
            this.plugin.settings.cursorBlink = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Theme")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("ghostty-dark", "Ghostty Dark")
          .addOption("ghostty-light", "Ghostty Light")
          .addOption("obsidian", "Match Obsidian")
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings.theme = value as GhosttySettings["theme"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Working directory")
      .setDesc("Starting directory for the terminal.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("vault", "Vault root")
          .addOption("home", "Home directory")
          .addOption("custom", "Custom path")
          .setValue(this.plugin.settings.workingDirectory)
          .onChange(async (value) => {
            this.plugin.settings.workingDirectory = value as GhosttySettings["workingDirectory"];
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.workingDirectory === "custom") {
      new Setting(containerEl)
        .setName("Custom working directory")
        .addText((text) =>
          text
            .setPlaceholder("/path/to/directory")
            .setValue(this.plugin.settings.customWorkingDirectory)
            .onChange(async (value) => {
              this.plugin.settings.customWorkingDirectory = value;
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(containerEl)
      .setName("Open on startup")
      .setDesc("Automatically open the terminal panel when Obsidian starts.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.openOnStartup)
          .onChange(async (value) => {
            this.plugin.settings.openOnStartup = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
