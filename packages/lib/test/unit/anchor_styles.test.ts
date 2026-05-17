/**
 * Verifies that components converted from non-anchor to anchor elements
 * have CSS that neutralizes default browser anchor styling (blue, underline).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cssPath = resolve(__dirname, "../../src/cli/entry/styles/components.css");
const css = readFileSync(cssPath, "utf-8");

describe("anchor style resets", () => {
	it("vw-card has text-decoration none", () => {
		// Extract the .vw-card { ... } block (not sub-selectors like .vw-card__header)
		const match = css.match(/\.vw-card\s*\{([^}]+)\}/);
		expect(match).not.toBeNull();
		expect(match?.[1]).toContain("text-decoration: none");
	});

	it("vw-card has color inherit", () => {
		const match = css.match(/\.vw-card\s*\{([^}]+)\}/);
		expect(match).not.toBeNull();
		expect(match?.[1]).toContain("color: inherit");
	});

	it("vw-top-bar__wordmark has text-decoration none", () => {
		const match = css.match(/\.vw-top-bar__wordmark\s*\{([^}]+)\}/);
		expect(match).not.toBeNull();
		expect(match?.[1]).toContain("text-decoration: none");
	});

	it("vw-top-bar__wordmark has explicit color", () => {
		const match = css.match(/\.vw-top-bar__wordmark\s*\{([^}]+)\}/);
		expect(match).not.toBeNull();
		// Should have a color set (not relying on browser default blue)
		expect(match?.[1]).toMatch(/color:\s*var\(--text-primary\)/);
	});
});
