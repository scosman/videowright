/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderCopyButton } from "../../src/cli/entry/components/copy_button.js";

describe("renderCopyButton", () => {
	let writeTextMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextMock },
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("copy_button_renders_as_button", () => {
		const btn = renderCopyButton("hello");
		expect(btn.tagName).toBe("BUTTON");
		expect(btn.className).toContain("vw-copy-btn");
	});

	it("copy_button_has_aria_label", () => {
		const btn = renderCopyButton("hello");
		expect(btn.getAttribute("aria-label")).toBe("Copy to clipboard");
	});

	it("copy_button_copies_text_to_clipboard", async () => {
		const btn = renderCopyButton("npx videowright render demo");
		btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		// Wait for the promise to resolve
		await vi.waitFor(() => {
			expect(writeTextMock).toHaveBeenCalledWith("npx videowright render demo");
		});
	});

	it("copy_button_swaps_to_check_icon_after_copy", async () => {
		const btn = renderCopyButton("hello");
		const initialHtml = btn.innerHTML;

		btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		await vi.waitFor(() => {
			expect(btn.classList.contains("vw-copy-btn--copied")).toBe(true);
		});
		// Icon should have changed
		expect(btn.innerHTML).not.toBe(initialHtml);
		expect(btn.getAttribute("aria-label")).toBe("Copied");
	});

	it("copy_button_reverts_icon_after_timeout", async () => {
		vi.useFakeTimers();
		const btn = renderCopyButton("hello");

		btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		// Let the promise microtask resolve
		await vi.waitFor(() => {
			expect(btn.classList.contains("vw-copy-btn--copied")).toBe(true);
		});

		// Advance past the 1.5s timeout
		vi.advanceTimersByTime(1500);

		expect(btn.classList.contains("vw-copy-btn--copied")).toBe(false);
		expect(btn.getAttribute("aria-label")).toBe("Copy to clipboard");

		vi.useRealTimers();
	});
});
