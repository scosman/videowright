/**
 * Tests for the dev preview HTML entry files.
 * After the MPA conversion, there are two HTML entries:
 * - index.html: loads entry_index.ts (video list)
 * - video.html: loads entry_video.ts (video player + HUD)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const indexPath = resolve(__dirname, "../../src/cli/entry/index.html");
const videoPath = resolve(__dirname, "../../src/cli/entry/video.html");
const indexHtml = readFileSync(indexPath, "utf-8");
const videoHtml = readFileSync(videoPath, "utf-8");

describe("dev preview index.html", () => {
	it("has an app container", () => {
		expect(indexHtml).toContain('id="app"');
	});

	it("loads entry_index.ts as a module with absolute path", () => {
		expect(indexHtml).toContain('type="module"');
		expect(indexHtml).toContain('src="/entry_index.ts"');
	});

	it("sets the page title", () => {
		expect(indexHtml).toContain("Videowright Dev");
	});
});

describe("dev preview video.html", () => {
	it("has an app container", () => {
		expect(videoHtml).toContain('id="app"');
	});

	it("loads entry_video.ts as a module with absolute path", () => {
		expect(videoHtml).toContain('type="module"');
		expect(videoHtml).toContain('src="/entry_video.ts"');
	});

	it("sets the page title", () => {
		expect(videoHtml).toContain("Videowright Dev");
	});

	describe("HUD relocation styles", () => {
		it("overrides HUD overlay positioning to relative", () => {
			expect(videoHtml).toContain("#dev-hud-container .vw-hud");
			expect(videoHtml).toMatch(/#dev-hud-container\s+\.vw-hud\s*\{[^}]*position:\s*relative/);
		});

		it("overrides HUD inner to relative positioning", () => {
			expect(videoHtml).toMatch(
				/#dev-hud-container\s+\.vw-hud-inner\s*\{[^}]*position:\s*relative/,
			);
		});

		it("overrides ended badge to relative positioning", () => {
			expect(videoHtml).toMatch(
				/#dev-hud-container\s+\.vw-hud-ended\s*\{[^}]*position:\s*relative/,
			);
		});

		it("overrides error overlay to relative positioning", () => {
			expect(videoHtml).toMatch(
				/#dev-hud-container\s+\.vw-hud-error-overlay\s*\{[^}]*position:\s*relative/,
			);
		});
	});
});
