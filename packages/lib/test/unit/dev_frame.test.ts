/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	HUD_HEIGHT,
	VIDEO_AREA_PADDING,
	_resetHudVisible,
	applyDevFrameSize,
	computeScale,
	getCurrentHudHeight,
	installHudKeyListener,
	toggleDevHud,
} from "../../src/cli/entry/dev_frame.js";

describe("computeScale", () => {
	it("returns 1 when available space is larger than target", () => {
		const scale = computeScale(1920, 1080, 2500, 1400);
		expect(scale).toBe(1);
	});

	it("scales down to fit width-constrained space", () => {
		// Available: 960x704
		// widthScale = 960/1920 = 0.5, heightScale = 704/1080 ~= 0.652
		const scale = computeScale(1920, 1080, 960, 704);
		expect(scale).toBe(0.5);
	});

	it("scales down to fit height-constrained space", () => {
		// Available: 1936x536
		// widthScale = 1936/1920 ~= 1.008, heightScale = 536/1080 ~= 0.496
		const scale = computeScale(1920, 1080, 1936, 536);
		expect(scale).toBeCloseTo(536 / 1080);
	});

	it("never upscales beyond 1", () => {
		const scale = computeScale(100, 100, 5000, 5000);
		expect(scale).toBe(1);
	});

	it("returns 1 when available space is zero or negative", () => {
		expect(computeScale(1920, 1080, 0, 500)).toBe(1);
		expect(computeScale(1920, 1080, 500, -10)).toBe(1);
	});

	it("handles exact fit", () => {
		const scale = computeScale(1920, 1080, 1920, 1080);
		expect(scale).toBe(1);
	});

	it("handles portrait target resolution", () => {
		// 1080x1920 in 960x704 available
		// widthScale = 960/1080 ~= 0.889, heightScale = 704/1920 ~= 0.367
		const scale = computeScale(1080, 1920, 960, 704);
		expect(scale).toBeCloseTo(704 / 1920);
	});
});

describe("exported constants", () => {
	it("HUD_HEIGHT is 80", () => {
		expect(HUD_HEIGHT).toBe(80);
	});

	it("VIDEO_AREA_PADDING is 12", () => {
		expect(VIDEO_AREA_PADDING).toBe(12);
	});
});

describe("applyDevFrameSize", () => {
	let host: HTMLDivElement;
	let scaleContainer: HTMLDivElement;

	beforeEach(() => {
		_resetHudVisible();

		scaleContainer = document.createElement("div");
		scaleContainer.id = "dev-scale-container";

		host = document.createElement("div");
		host.id = "player-host";

		scaleContainer.appendChild(host);
		document.body.appendChild(scaleContainer);

		// Mock window dimensions
		Object.defineProperty(window, "innerWidth", {
			value: 1024,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(window, "innerHeight", {
			value: 768,
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		scaleContainer.remove();
	});

	it("sets player-host to native resolution", () => {
		applyDevFrameSize([1920, 1080]);

		expect(host.style.width).toBe("1920px");
		expect(host.style.height).toBe("1080px");
	});

	it("applies scale using fixed HUD_HEIGHT and VIDEO_AREA_PADDING constants", () => {
		applyDevFrameSize([1920, 1080]);

		// viewport: 1024x768, HUD_HEIGHT: 80, padding: 12
		// availableW = 1024 - 24 = 1000
		// availableH = 768 - 80 - 24 = 664
		// widthScale = 1000/1920 ~= 0.5208, heightScale = 664/1080 ~= 0.6148
		// scale = min(0.5208, 0.6148, 1) = 1000/1920
		const expectedScale = 1000 / 1920;
		expect(host.style.transform).toBe(`scale(${expectedScale})`);
	});

	it("sets scale container to scaled dimensions", () => {
		applyDevFrameSize([1920, 1080]);

		const expectedScale = 1000 / 1920;
		expect(scaleContainer.style.width).toBe(`${1920 * expectedScale}px`);
		expect(scaleContainer.style.height).toBe(`${1080 * expectedScale}px`);
	});

	it("does not upscale when viewport is larger than target", () => {
		Object.defineProperty(window, "innerWidth", { value: 3840, configurable: true });
		Object.defineProperty(window, "innerHeight", { value: 2160, configurable: true });

		applyDevFrameSize([1920, 1080]);

		expect(host.style.transform).toBe("scale(1)");
		expect(scaleContainer.style.width).toBe("1920px");
		expect(scaleContainer.style.height).toBe("1080px");
	});

	it("does not read HUD height from the DOM", () => {
		// Create a HUD container with a different height -- scale should NOT use it
		const hudContainer = document.createElement("div");
		hudContainer.id = "dev-hud-container";
		document.body.appendChild(hudContainer);

		vi.spyOn(hudContainer, "getBoundingClientRect").mockReturnValue({
			height: 999,
			width: 0,
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		});

		applyDevFrameSize([1920, 1080]);

		// Should use HUD_HEIGHT constant (80), not the mocked 999
		const expectedScale = 1000 / 1920;
		expect(host.style.transform).toBe(`scale(${expectedScale})`);
		expect(hudContainer.getBoundingClientRect).not.toHaveBeenCalled();

		hudContainer.remove();
	});

	it("gracefully does nothing when elements are missing", () => {
		host.remove();
		scaleContainer.remove();

		expect(() => applyDevFrameSize([1920, 1080])).not.toThrow();
	});

	it("registers resize listener", () => {
		const addSpy = vi.spyOn(window, "addEventListener");

		applyDevFrameSize([1920, 1080]);

		expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));
		addSpy.mockRestore();
	});
});

describe("getCurrentHudHeight", () => {
	beforeEach(() => {
		_resetHudVisible();
	});

	it("returns HUD_HEIGHT when HUD is visible (default)", () => {
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);
	});

	it("returns 0 after toggling HUD off", () => {
		toggleDevHud();
		expect(getCurrentHudHeight()).toBe(0);
	});

	it("returns HUD_HEIGHT after toggling off then on", () => {
		toggleDevHud();
		toggleDevHud();
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);
	});
});

describe("toggleDevHud", () => {
	let layout: HTMLDivElement;
	let hudContainer: HTMLDivElement;
	let host: HTMLDivElement;
	let scaleContainer: HTMLDivElement;

	let hudContent: HTMLDivElement;

	beforeEach(() => {
		_resetHudVisible();

		layout = document.createElement("div");
		layout.id = "dev-layout";
		document.body.appendChild(layout);

		hudContainer = document.createElement("div");
		hudContainer.id = "dev-hud-container";
		hudContainer.style.overflow = "visible";

		// Inner HUD content element (the one that gets hidden)
		hudContent = document.createElement("div");
		hudContent.className = "vw-hud";
		hudContainer.appendChild(hudContent);

		document.body.appendChild(hudContainer);

		scaleContainer = document.createElement("div");
		scaleContainer.id = "dev-scale-container";

		host = document.createElement("div");
		host.id = "player-host";

		scaleContainer.appendChild(host);
		document.body.appendChild(scaleContainer);

		Object.defineProperty(window, "innerWidth", {
			value: 1024,
			writable: true,
			configurable: true,
		});
		Object.defineProperty(window, "innerHeight", {
			value: 768,
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		layout.remove();
		hudContainer.remove();
		scaleContainer.remove();
	});

	it("returns false when toggling from visible to hidden", () => {
		expect(toggleDevHud()).toBe(false);
	});

	it("returns true when toggling from hidden back to visible", () => {
		toggleDevHud();
		expect(toggleDevHud()).toBe(true);
	});

	it("sets grid template to 0 1fr 0px when hiding HUD", () => {
		toggleDevHud();
		expect(layout.style.gridTemplateRows).toBe("0 1fr 0px");
	});

	it("restores grid template to auto 1fr 80px when showing HUD", () => {
		toggleDevHud();
		toggleDevHud();
		expect(layout.style.gridTemplateRows).toBe("auto 1fr 80px");
	});

	it("hides HUD content via display:none when toggling off", () => {
		toggleDevHud();
		expect(hudContent.style.display).toBe("none");
	});

	it("restores HUD content display when toggling on", () => {
		toggleDevHud();
		toggleDevHud();
		expect(hudContent.style.display).toBe("");
	});

	it("keeps hudContainer visible when HUD is hidden so hide-tab remains accessible", () => {
		toggleDevHud();
		// The container itself must NOT be display:none — only the inner
		// .vw-hud element is hidden. The hide-HUD tab is a child of the
		// container positioned at top:-8px with overflow:visible.
		expect(hudContainer.style.display).not.toBe("none");
	});

	it("recomputes scale when HUD is hidden (more available height)", () => {
		applyDevFrameSize([1920, 1080]);

		// With HUD visible: availableH = 768 - 80 - 24 = 664
		const scaleWithHud = 1000 / 1920;
		expect(host.style.transform).toBe(`scale(${scaleWithHud})`);

		// Toggle HUD off: availableH = 768 - 0 - 24 = 744
		toggleDevHud();
		const scaleWithoutHud = Math.min(1000 / 1920, 744 / 1080, 1);
		expect(host.style.transform).toBe(`scale(${scaleWithoutHud})`);
	});

	it("recomputes scale back when HUD is restored", () => {
		applyDevFrameSize([1920, 1080]);
		toggleDevHud();
		toggleDevHud();

		const scaleWithHud = 1000 / 1920;
		expect(host.style.transform).toBe(`scale(${scaleWithHud})`);
	});
});

describe("installHudKeyListener", () => {
	let cleanup: (() => void) | undefined;

	beforeEach(() => {
		_resetHudVisible();
	});

	afterEach(() => {
		if (cleanup) cleanup();
		cleanup = undefined;
	});

	it("toggles HUD on 'h' keydown", () => {
		cleanup = installHudKeyListener();
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);

		document.dispatchEvent(new KeyboardEvent("keydown", { key: "h" }));
		expect(getCurrentHudHeight()).toBe(0);
	});

	it("toggles HUD on 'H' keydown", () => {
		cleanup = installHudKeyListener();
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "H" }));
		expect(getCurrentHudHeight()).toBe(0);
	});

	it("ignores other keys", () => {
		cleanup = installHudKeyListener();
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);
	});

	it("ignores 'h' when target is an INPUT element", () => {
		cleanup = installHudKeyListener();
		const input = document.createElement("input");
		document.body.appendChild(input);

		const event = new KeyboardEvent("keydown", {
			key: "h",
			bubbles: true,
		});
		input.dispatchEvent(event);
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);

		input.remove();
	});

	it("ignores 'h' when target is a TEXTAREA element", () => {
		cleanup = installHudKeyListener();
		const textarea = document.createElement("textarea");
		document.body.appendChild(textarea);

		const event = new KeyboardEvent("keydown", {
			key: "h",
			bubbles: true,
		});
		textarea.dispatchEvent(event);
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);

		textarea.remove();
	});

	it("ignores 'h' when target is contenteditable", () => {
		cleanup = installHudKeyListener();
		const div = document.createElement("div");
		div.contentEditable = "true";
		document.body.appendChild(div);

		const event = new KeyboardEvent("keydown", {
			key: "h",
			bubbles: true,
		});
		div.dispatchEvent(event);
		expect(getCurrentHudHeight()).toBe(HUD_HEIGHT);

		div.remove();
	});
});
