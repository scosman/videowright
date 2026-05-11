/**
 * Tests for the dev preview index.html structure.
 * Verifies grid layout, crop marks, HUD container, and scale container.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const htmlPath = resolve(__dirname, "../../src/cli/entry/index.html");
const html = readFileSync(htmlPath, "utf-8");

describe("dev preview index.html", () => {
	describe("layout structure", () => {
		it("uses a grid layout with video area and fixed-height HUD row", () => {
			expect(html).toContain('id="dev-layout"');
			expect(html).toContain("grid-template-rows: 1fr 80px");
		});

		it("contains the dev-video-area for centering the frame", () => {
			expect(html).toContain('id="dev-video-area"');
			expect(html).toContain("place-items: center");
		});

		it("contains the dev-scale-container inside the video area", () => {
			const videoIdx = html.indexOf('id="dev-video-area"');
			const scaleIdx = html.indexOf('id="dev-scale-container"');
			expect(scaleIdx).toBeGreaterThan(videoIdx);
		});

		it("contains the player-host inside scale container", () => {
			const scaleIdx = html.indexOf('id="dev-scale-container"');
			const hostIdx = html.indexOf('id="player-host"');
			expect(hostIdx).toBeGreaterThan(scaleIdx);
		});

		it("has HUD container as second grid row", () => {
			const videoIdx = html.indexOf('id="dev-video-area"');
			const hudIdx = html.indexOf('id="dev-hud-container"');
			expect(hudIdx).toBeGreaterThan(videoIdx);
			// HUD should be a sibling of dev-video-area, both inside dev-layout
			const layoutIdx = html.indexOf('id="dev-layout"');
			expect(hudIdx).toBeGreaterThan(layoutIdx);
		});

		it("prevents all scrolling on body", () => {
			expect(html).toContain("overflow: hidden");
		});

		it("does not set player-host to viewport dimensions", () => {
			expect(html).not.toMatch(/#player-host\s*\{[^}]*100vw/);
			expect(html).not.toMatch(/#player-host\s*\{[^}]*100vh/);
		});

		it("uses minimal padding on the video area", () => {
			expect(html).toMatch(/#dev-video-area\s*\{[^}]*padding:\s*12px/);
		});
	});

	describe("HUD fixed height and overrides", () => {
		it("HUD container has strictly fixed 80px height", () => {
			expect(html).toMatch(/#dev-hud-container\s*\{[^}]*height:\s*80px/);
			expect(html).toMatch(/#dev-hud-container\s*\{[^}]*min-height:\s*80px/);
			expect(html).toMatch(/#dev-hud-container\s*\{[^}]*max-height:\s*80px/);
		});

		it("HUD container clips overflow", () => {
			expect(html).toMatch(/#dev-hud-container\s*\{[^}]*overflow:\s*hidden/);
		});

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

	describe("crop/trim marks", () => {
		it("has 8 edge-aligned strokes (2 per corner, horizontal + vertical)", () => {
			expect(html).toContain("vw-crop-mark--tl-h");
			expect(html).toContain("vw-crop-mark--tl-v");
			expect(html).toContain("vw-crop-mark--tr-h");
			expect(html).toContain("vw-crop-mark--tr-v");
			expect(html).toContain("vw-crop-mark--bl-h");
			expect(html).toContain("vw-crop-mark--bl-v");
			expect(html).toContain("vw-crop-mark--br-h");
			expect(html).toContain("vw-crop-mark--br-v");
		});

		it("does not use old L-bracket mark classes", () => {
			const oldPattern = /vw-crop-mark--(tl|tr|bl|br)(?!-[hv])/;
			expect(html).not.toMatch(oldPattern);
		});

		it("crop marks container has pointer-events none", () => {
			expect(html).toContain("pointer-events: none");
		});

		it("strokes use subtle low-contrast color", () => {
			expect(html).toContain("background: rgba(255, 255, 255, 0.25)");
		});

		it("strokes are positioned outside the frame with a gap", () => {
			expect(html).toContain("left: -26px");
			expect(html).toContain("right: -26px");
			expect(html).toContain("top: -26px");
			expect(html).toContain("bottom: -26px");
		});

		it("crop marks container allows overflow for outside-frame positioning", () => {
			expect(html).toContain("overflow: visible");
		});
	});
});
