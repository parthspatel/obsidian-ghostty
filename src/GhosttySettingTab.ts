import { App, PluginSettingTab, Setting } from "obsidian";
import type GhosttyPlugin from "./main";
import type { GhosttySettings } from "./settings";

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
			.setDesc("Path to the shell executable. Leave empty to use the default system shell.")
			.addText((text) =>
				text
					.setPlaceholder("/bin/bash, /bin/zsh, etc.")
					.setValue(this.plugin.settings.shellPath)
					.onChange(async (value) => {
						this.plugin.settings.shellPath = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Shell arguments")
			.setDesc("Space-separated arguments to pass to the shell.")
			.addText((text) =>
				text
					.setPlaceholder("--login")
					.setValue(this.plugin.settings.shellArgs)
					.onChange(async (value) => {
						this.plugin.settings.shellArgs = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Appearance" });

		new Setting(containerEl)
			.setName("Font family")
			.setDesc("Font family for the terminal.")
			.addText((text) =>
				text.setValue(this.plugin.settings.fontFamily).onChange(async (value) => {
					this.plugin.settings.fontFamily = value;
					await this.plugin.saveSettings();
					this.plugin.updateTerminalSettings();
				})
			);

		new Setting(containerEl)
			.setName("Font size")
			.setDesc("Font size in pixels for the terminal.")
			.addSlider((slider) =>
				slider
					.setLimits(8, 32, 1)
					.setValue(this.plugin.settings.fontSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.fontSize = value;
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
					})
			);

		new Setting(containerEl)
			.setName("Cursor style")
			.setDesc("The style of the terminal cursor.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						block: "Block",
						underline: "Underline",
						bar: "Bar",
					})
					.setValue(this.plugin.settings.cursorStyle)
					.onChange(async (value) => {
						this.plugin.settings.cursorStyle = value as GhosttySettings["cursorStyle"];
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
					})
			);

		new Setting(containerEl)
			.setName("Cursor blink")
			.setDesc("Whether the cursor should blink.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.cursorBlink).onChange(async (value) => {
					this.plugin.settings.cursorBlink = value;
					await this.plugin.saveSettings();
					this.plugin.updateTerminalSettings();
				})
			);

		new Setting(containerEl)
			.setName("Scrollback")
			.setDesc("Number of lines of scrollback to keep.")
			.addSlider((slider) =>
				slider
					.setLimits(500, 50000, 500)
					.setValue(this.plugin.settings.scrollback)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.scrollback = value;
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
					})
			);

		containerEl.createEl("h3", { text: "Theme" });

		new Setting(containerEl)
			.setName("Color theme")
			.setDesc("Color theme for the terminal.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						"ghostty-dark": "Ghostty Dark",
						"ghostty-light": "Ghostty Light",
						custom: "Custom",
					})
					.setValue(this.plugin.settings.theme)
					.onChange(async (value) => {
						this.plugin.settings.theme = value as GhosttySettings["theme"];
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
						this.display(); // Refresh to show/hide custom color fields
					})
			);

		if (this.plugin.settings.theme === "custom") {
			new Setting(containerEl)
				.setName("Background color")
				.setDesc("Custom background color (hex).")
				.addText((text) =>
					text.setValue(this.plugin.settings.customBackground).onChange(async (value) => {
						this.plugin.settings.customBackground = value;
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
					})
				);

			new Setting(containerEl)
				.setName("Foreground color")
				.setDesc("Custom foreground/text color (hex).")
				.addText((text) =>
					text.setValue(this.plugin.settings.customForeground).onChange(async (value) => {
						this.plugin.settings.customForeground = value;
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
					})
				);

			new Setting(containerEl)
				.setName("Cursor color")
				.setDesc("Custom cursor color (hex).")
				.addText((text) =>
					text.setValue(this.plugin.settings.customCursor).onChange(async (value) => {
						this.plugin.settings.customCursor = value;
						await this.plugin.saveSettings();
						this.plugin.updateTerminalSettings();
					})
				);
		}

		containerEl.createEl("h3", { text: "Behavior" });

		new Setting(containerEl)
			.setName("Open on startup")
			.setDesc("Automatically open the terminal panel when Obsidian starts.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openOnStartup).onChange(async (value) => {
					this.plugin.settings.openOnStartup = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
