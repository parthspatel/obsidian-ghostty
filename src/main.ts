import { Notice, Plugin } from "obsidian";
import { GhosttyView, VIEW_TYPE_GHOSTTY } from "./GhosttyView";
import { GhosttySettingTab } from "./GhosttySettingTab";
import { DEFAULT_SETTINGS } from "./settings";
import type { GhosttySettings } from "./settings";

export default class GhosttyPlugin extends Plugin {
	settings: GhosttySettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register the terminal view
		this.registerView(VIEW_TYPE_GHOSTTY, (leaf) => new GhosttyView(leaf, this.settings));

		// Add ribbon icon to toggle the terminal
		this.addRibbonIcon("terminal", "Toggle Ghostty Terminal", () => {
			this.toggleTerminal();
		});

		// Add command to toggle terminal
		this.addCommand({
			id: "toggle-ghostty-terminal",
			name: "Toggle terminal panel",
			callback: () => {
				this.toggleTerminal();
			},
		});

		// Add command to open a new terminal
		this.addCommand({
			id: "open-ghostty-terminal",
			name: "Open new terminal panel",
			callback: () => {
				this.activateView();
			},
		});

		// Add command to focus terminal
		this.addCommand({
			id: "focus-ghostty-terminal",
			name: "Focus terminal",
			callback: () => {
				this.focusTerminal();
			},
		});

		// Register settings tab
		this.addSettingTab(new GhosttySettingTab(this.app, this));

		// Open on startup if configured
		if (this.settings.openOnStartup) {
			this.app.workspace.onLayoutReady(() => {
				this.activateView();
			});
		}
	}

	onunload(): void {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_GHOSTTY);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async toggleTerminal(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY);
		if (existing.length > 0) {
			// Close existing terminal
			existing.forEach((leaf) => leaf.detach());
		} else {
			// Open new terminal
			await this.activateView();
		}
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY).find((l) => l !== null);

		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (!rightLeaf) {
				new Notice("Could not open terminal: unable to create panel.");
				return;
			}
			leaf = rightLeaf;
			await leaf.setViewState({
				type: VIEW_TYPE_GHOSTTY,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
		// Focus the terminal after a short delay
		setTimeout(() => {
			const view = leaf?.view;
			if (view instanceof GhosttyView) {
				view.focus();
			}
		}, 200);
	}

	private focusTerminal(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY);
		if (leaves.length > 0) {
			this.app.workspace.revealLeaf(leaves[0]);
			const view = leaves[0].view;
			if (view instanceof GhosttyView) {
				view.focus();
			}
		} else {
			this.activateView();
		}
	}

	updateTerminalSettings(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY);
		leaves.forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof GhosttyView) {
				view.updateSettings(this.settings);
			}
		});
	}
}
