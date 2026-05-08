/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { createSlot } from "../../src/player/slot.js";

describe("slot", () => {
	it("slot_is_plain_div", () => {
		const el = createSlot("a");
		expect(el.tagName).toBe("DIV");
		expect(el.className).toBe("vw-slot");
		expect(el.dataset.slot).toBe("a");
	});

	it("has inline positioning styles", () => {
		const el = createSlot("b");
		expect(el.style.position).toBe("absolute");
		expect(el.style.inset).toBe("0px");
		expect(el.style.overflow).toBe("hidden");
	});

	it("does not attach a shadow root", () => {
		const el = createSlot("a");
		expect(el.shadowRoot).toBeNull();
	});
});
