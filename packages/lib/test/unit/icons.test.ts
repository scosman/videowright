import { describe, expect, it } from "vitest";
import {
	iconArrowLeft,
	iconCheck,
	iconChevronDown,
	iconChevronRight,
	iconChevronUp,
	iconCopy,
	iconDownload,
	iconX,
} from "../../src/cli/entry/components/icons.js";

describe("icons", () => {
	const icons = [
		["iconDownload", iconDownload],
		["iconCopy", iconCopy],
		["iconCheck", iconCheck],
		["iconX", iconX],
		["iconChevronRight", iconChevronRight],
		["iconChevronDown", iconChevronDown],
		["iconChevronUp", iconChevronUp],
		["iconArrowLeft", iconArrowLeft],
	] as const;

	for (const [name, fn] of icons) {
		it(`${name} returns valid SVG string`, () => {
			const svg = fn();
			expect(svg).toContain("<svg");
			expect(svg).toContain("</svg>");
			expect(svg).toContain('stroke="currentColor"');
			expect(svg).toContain('width="16"');
			expect(svg).toContain('height="16"');
		});
	}
});
