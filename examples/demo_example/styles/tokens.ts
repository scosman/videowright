/**
 * Design tokens as TypeScript constants.
 * Mirrors styles/tokens.css for use in Three.js, canvas, and computed styles.
 */

export const palette = {
	bgPrimary: "#07070d",
	bgSurface: "#111119",
	bgElevated: "#1a1a26",

	textPrimary: "#f0f0f5",
	textSecondary: "#9898b0",
	textMuted: "#5c5c78",

	accentBlue: "#3b82f6",
	accentBlueLight: "#60a5fa",
	accentGreen: "#10b981",
	accentPurple: "#8b5cf6",
	accentAmber: "#f59e0b",
} as const;

export const font = {
	sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	mono: '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, monospace',
} as const;

export const spacing = {
	1: "0.25rem",
	2: "0.5rem",
	3: "0.75rem",
	4: "1rem",
	6: "1.5rem",
	8: "2rem",
	12: "3rem",
	16: "4rem",
	24: "6rem",
} as const;

export const radius = {
	sm: "0.375rem",
	md: "0.5rem",
	lg: "0.75rem",
	xl: "1rem",
} as const;

export const easing = {
	out: "cubic-bezier(0.16, 1, 0.3, 1)",
	inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
	spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const duration = {
	fast: 200,
	normal: 400,
	slow: 700,
} as const;
