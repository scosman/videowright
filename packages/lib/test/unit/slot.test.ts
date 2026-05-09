/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { clearSlotAnimations, createSlot, getSlotContent } from "../../src/player/slot.js";

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

	it("contains a content div with expected class and styles", () => {
		const el = createSlot("a");
		const content = el.querySelector(".vw-slot-content") as HTMLDivElement;
		expect(content).not.toBeNull();
		expect(content.tagName).toBe("DIV");
		expect(content.style.width).toBe("100%");
		expect(content.style.height).toBe("100%");
		expect(content.style.position).toBe("relative");
	});

	it("content div is the only child of the slot", () => {
		const el = createSlot("x");
		expect(el.children.length).toBe(1);
		expect(el.children[0].className).toBe("vw-slot-content");
	});
});

describe("getSlotContent", () => {
	it("returns the inner content div", () => {
		const slot = createSlot("a");
		const content = getSlotContent(slot);
		expect(content).toBe(slot.querySelector(".vw-slot-content"));
		expect(content.className).toBe("vw-slot-content");
	});
});

describe("clearSlotAnimations", () => {
	it("cancels all animations returned by getAnimations", () => {
		const slot = createSlot("a");
		const anim1 = { cancel: vi.fn() };
		const anim2 = { cancel: vi.fn() };
		slot.getAnimations = vi.fn().mockReturnValue([anim1, anim2]);

		clearSlotAnimations(slot);

		expect(slot.getAnimations).toHaveBeenCalledOnce();
		expect(anim1.cancel).toHaveBeenCalledOnce();
		expect(anim2.cancel).toHaveBeenCalledOnce();
	});

	it("does not throw when getAnimations is undefined (jsdom compat)", () => {
		const slot = createSlot("a");
		// In jsdom, getAnimations may not exist. Simulate by deleting it.
		// biome-ignore lint/performance/noDelete: testing undefined path
		delete (slot as unknown as Record<string, unknown>).getAnimations;

		expect(() => clearSlotAnimations(slot)).not.toThrow();
	});

	it("handles empty animations array", () => {
		const slot = createSlot("a");
		slot.getAnimations = vi.fn().mockReturnValue([]);

		clearSlotAnimations(slot);

		expect(slot.getAnimations).toHaveBeenCalledOnce();
	});
});
