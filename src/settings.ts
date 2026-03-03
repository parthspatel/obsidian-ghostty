export interface GhosttySettings {
	shellPath: string;
	shellArgs: string;
	fontFamily: string;
	fontSize: number;
	cursorStyle: "block" | "underline" | "bar";
	cursorBlink: boolean;
	scrollback: number;
	theme: "ghostty-dark" | "ghostty-light" | "custom";
	customBackground: string;
	customForeground: string;
	customCursor: string;
	openOnStartup: boolean;
}

export const DEFAULT_SETTINGS: GhosttySettings = {
	shellPath: "",
	shellArgs: "",
	fontFamily: "JetBrains Mono, Fira Code, Menlo, Monaco, Consolas, monospace",
	fontSize: 14,
	cursorStyle: "block",
	cursorBlink: true,
	scrollback: 5000,
	theme: "ghostty-dark",
	customBackground: "#282c34",
	customForeground: "#abb2bf",
	customCursor: "#528bff",
	openOnStartup: false,
};

export const GHOSTTY_THEMES = {
	"ghostty-dark": {
		background: "#282c34",
		foreground: "#abb2bf",
		cursor: "#528bff",
		selectionBackground: "#3e4452",
		black: "#1e2127",
		red: "#e06c75",
		green: "#98c379",
		yellow: "#d19a66",
		blue: "#61afef",
		magenta: "#c678dd",
		cyan: "#56b6c2",
		white: "#abb2bf",
		brightBlack: "#5c6370",
		brightRed: "#e06c75",
		brightGreen: "#98c379",
		brightYellow: "#d19a66",
		brightBlue: "#61afef",
		brightMagenta: "#c678dd",
		brightCyan: "#56b6c2",
		brightWhite: "#ffffff",
	},
	"ghostty-light": {
		background: "#fafafa",
		foreground: "#383a42",
		cursor: "#526fff",
		selectionBackground: "#e5e5e6",
		black: "#383a42",
		red: "#e45649",
		green: "#50a14f",
		yellow: "#c18401",
		blue: "#4078f2",
		magenta: "#a626a4",
		cyan: "#0184bc",
		white: "#a0a1a7",
		brightBlack: "#696c77",
		brightRed: "#e45649",
		brightGreen: "#50a14f",
		brightYellow: "#c18401",
		brightBlue: "#4078f2",
		brightMagenta: "#a626a4",
		brightCyan: "#0184bc",
		brightWhite: "#fafafa",
	},
};
