/**
 * Tests for the dev preview index.html structure.
 * After the unified video server refactor, index.html is a simple SPA shell.
 * The player layout, crop marks, and HUD are built dynamically by video_view.ts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const htmlPath = resolve(__dirname, "../../src/cli/entry/index.html");
const html = readFileSync(htmlPath, "utf-8");

describe("dev preview index.html", () => {
	describe("SPA shell structure", () => {
		it("has an app container for the SPA router", () => {
			expect(html).toContain('id="app"');
		});

		it("loads entry_client.ts as a module", () => {
			expect(html).toContain('type="module"');
			expect(html).toContain("entry_client.ts");
		});

		it("sets the page title", () => {
			expect(html).toContain("Videowright Dev");
		});
	});

	describe("HUD relocation styles", () => {
		it("overrides HUD overlay positioning to relative", () => {
			expect(html).toContain("#dev-hud-container .vw-hud");
			expect(html).toMatch(/#dev-hud-container\s+\.vw-hud\s*\{[^}]*position:\s*relative/);
		});

		it("overrides HUD inner to relative positioning", () => {
			expect(html).toMatch(/#dev-hud-container\s+\.vw-hud-inner\s*\{[^}]*position:\s*relative/);
		});

		it("overrides ended badge to relative positioning", () => {
			expect(html).toMatch(/#dev-hud-container\s+\.vw-hud-ended\s*\{[^}]*position:\s*relative/);
		});

		it("overrides error overlay to relative positioning", () => {
			expect(html).toMatch(
				/#dev-hud-container\s+\.vw-hud-error-overlay\s*\{[^}]*position:\s*relative/,
			);
		});
	});
});
