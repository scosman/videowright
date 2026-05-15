/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { renderHideHudTab } from "../../src/cli/entry/components/hide_hud_tab.js";

describe("renderHideHudTab", () => {
	it("hide_hud_tab_renders_button", () => {
		const tab = renderHideHudTab({ onToggle: () => true });
		expect(tab.tagName).toBe("BUTTON");
		expect(tab.className).toBe("vw-hide-hud-tab");
	});

	it("hide_hud_tab_has_aria_label", () => {
		const tab = renderHideHudTab({ onToggle: () => true });
		expect(tab.getAttribute("aria-label")).toBe("Toggle HUD");
	});

	it("hide_hud_tab_starts_with_chevron_down", () => {
		const tab = renderHideHudTab({ onToggle: () => false });
		// ChevronDown has "6 9 12 15 18 9" polyline points
		expect(tab.innerHTML).toContain("6 9 12 15 18 9");
	});

	it("hide_hud_tab_toggles_chevron_on_click", () => {
		let visible = true;
		const tab = renderHideHudTab({
			onToggle: () => {
				visible = !visible;
				return visible;
			},
		});

		// Initially shows chevron down (HUD visible)
		expect(tab.innerHTML).toContain("6 9 12 15 18 9");

		// Click → HUD hidden → shows chevron up
		tab.click();
		expect(tab.innerHTML).toContain("18 15 12 9 6 15");

		// Click → HUD visible again → shows chevron down
		tab.click();
		expect(tab.innerHTML).toContain("6 9 12 15 18 9");
	});

	it("hide_hud_tab_calls_onToggle", () => {
		const onToggle = vi.fn(() => false);
		const tab = renderHideHudTab({ onToggle });

		tab.click();
		expect(onToggle).toHaveBeenCalledOnce();
	});

	it("hide_hud_tab_contains_svg_icon", () => {
		const tab = renderHideHudTab({ onToggle: () => true });
		const svg = tab.querySelector("svg");
		expect(svg).not.toBeNull();
	});
});
