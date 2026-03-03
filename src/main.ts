import { Plugin, WorkspaceLeaf } from "obsidian";
import { GhosttyView, VIEW_TYPE_GHOSTTY } from "./ghostty-view";
import {
  GhosttySettings,
  DEFAULT_SETTINGS,
  GhosttySettingTab,
} from "./settings";

export default class GhosttyPlugin extends Plugin {
  settings: GhosttySettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register the terminal view
    this.registerView(VIEW_TYPE_GHOSTTY, (leaf) => new GhosttyView(leaf, this));

    // Add ribbon icon to toggle terminal
    this.addRibbonIcon("terminal", "Open Ghostty Terminal", () => {
      this.activateView();
    });

    // Register commands
    this.addCommand({
      id: "open-ghostty",
      name: "Open terminal in side panel",
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: "close-ghostty",
      name: "Close terminal",
      callback: () => {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_GHOSTTY);
      },
    });

    this.addCommand({
      id: "toggle-ghostty",
      name: "Toggle terminal",
      callback: () => this.toggleView(),
    });

    // Settings tab
    this.addSettingTab(new GhosttySettingTab(this.app, this));

    // Open on startup if configured
    if (this.settings.openOnStartup) {
      this.app.workspace.onLayoutReady(() => {
        this.activateView();
      });
    }
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GHOSTTY);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    // Check if already open
    const existing = workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    // Open in right sidebar
    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({
        type: VIEW_TYPE_GHOSTTY,
        active: true,
      });
      workspace.revealLeaf(leaf);
    }
  }

  async toggleView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY);
    if (existing.length > 0) {
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_GHOSTTY);
    } else {
      await this.activateView();
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);

    // Notify open views about settings change
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GHOSTTY);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof GhosttyView) {
        view.applySettings();
      }
    }
  }
}
