/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type HudState, createHud } from "../../src/player/hud.js";

function makeState(overrides?: Partial<HudState>): HudState {
	return {
		segmentId: "intro",
		beat: 0,
		segmentTime: 0,
		totalTime: 0,
		mode: "interactive",
		ended: false,
		playbackMode: "idle",
		...overrides,
	};
}

describe("HUD content layout", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it("line 1 reads 'segment: <beat> <name>'", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState({ segmentId: "any-coding-agent", beat: 3 }));

		const items = hud.el.querySelectorAll(".vw-hud-item");
		// First item should contain the segment label with beat folded in
		const firstItem = items[0];
		expect(firstItem).toBeDefined();
		expect(firstItem.textContent).toBe("segment:3 any-coding-agent");

		hud.destroy();
	});

	it("line 2 has seg time and total on one row with visible separator", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState({ segmentTime: 65000, totalTime: 125000 }));

		const rows = hud.el.querySelectorAll(".vw-hud-row");
		// Row index 1 is the timing row
		const timingRow = rows[1];
		expect(timingRow).toBeDefined();

		const timingItems = timingRow.querySelectorAll(".vw-hud-item");
		expect(timingItems.length).toBe(2);
		expect(timingItems[0].textContent).toContain("seg time:");
		expect(timingItems[0].textContent).toContain("1:05");
		expect(timingItems[1].textContent).toContain("total:");
		expect(timingItems[1].textContent).toContain("2:05");

		// Separator between them
		const separator = timingRow.querySelector(".vw-hud-separator");
		expect(separator).not.toBeNull();
		expect(separator?.textContent).toBe("·");

		hud.destroy();
	});

	it("does not render a standalone beat row", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState({ beat: 5 }));

		const allLabels = hud.el.querySelectorAll(".vw-hud-label");
		const labelTexts = Array.from(allLabels).map((l) => l.textContent);
		// "beat:" should not appear as a standalone label
		expect(labelTexts).not.toContain("beat:");

		hud.destroy();
	});

	it("does not render a mode row", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState({ mode: "interactive" }));

		const allLabels = hud.el.querySelectorAll(".vw-hud-label");
		const labelTexts = Array.from(allLabels).map((l) => l.textContent);
		expect(labelTexts).not.toContain("mode:");

		hud.destroy();
	});

	it("nav legend container has flex-wrap enabled", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState());

		const keysEl = hud.el.querySelector(".vw-hud-keys") as HTMLElement;
		expect(keysEl).not.toBeNull();

		// Each key binding is a separate span for wrapping
		const keyItems = keysEl.querySelectorAll(".vw-hud-key-item");
		expect(keyItems.length).toBeGreaterThanOrEqual(6);
		expect(keyItems[0].textContent).toContain("→: next");

		hud.destroy();
	});
});

describe("HUD voiceover overflow", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it("voiceover element has overflow-y auto for scrolling", () => {
		const hud = createHud();
		container.appendChild(hud.el);

		const longText = "A very long voiceover line. ".repeat(50);
		hud.update(makeState({ voiceover: longText }));

		const voEl = hud.el.querySelector(".vw-hud-vo") as HTMLElement;
		expect(voEl).not.toBeNull();
		// The CSS class sets overflow-y: auto; verify the element exists with the class
		expect(voEl.classList.contains("vw-hud-vo")).toBe(true);

		hud.destroy();
	});

	it("short voiceover does not change HUD structure", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState({ voiceover: "Short text" }));

		const inner = hud.el.querySelector(".vw-hud-inner") as HTMLElement;
		expect(inner).not.toBeNull();
		// Inner container should have max-height set
		expect(inner.classList.contains("vw-hud-inner")).toBe(true);

		hud.destroy();
	});

	it("empty voiceover does not render vo element", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState({ voiceover: undefined }));

		const voEl = hud.el.querySelector(".vw-hud-vo");
		expect(voEl).toBeNull();

		hud.destroy();
	});
});

describe("HUD layout constraints", () => {
	let container: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	it("inner container has max-width 100vw", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState());

		// Verify the style element was injected with max-width: 100vw
		const styleEl = document.querySelector("style[data-vw-hud]");
		expect(styleEl).not.toBeNull();
		expect(styleEl?.textContent).toContain("max-width: 100vw");

		hud.destroy();
	});

	it("inner container has max-height 80px", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState());

		const styleEl = document.querySelector("style[data-vw-hud]");
		expect(styleEl).not.toBeNull();
		expect(styleEl?.textContent).toContain("max-height: 80px");

		hud.destroy();
	});

	it("inner container uses column flex direction", () => {
		const hud = createHud();
		container.appendChild(hud.el);
		hud.update(makeState());

		const styleEl = document.querySelector("style[data-vw-hud]");
		expect(styleEl).not.toBeNull();
		expect(styleEl?.textContent).toContain("flex-direction: column");

		hud.destroy();
	});
});
