/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { renderVideoCard } from "../../src/cli/entry/components/video_card.js";

describe("renderVideoCard", () => {
	it("video_card_renders_title_slug_style", () => {
		const card = renderVideoCard({
			slug: "demo_video",
			title: "Demo Title",
			style: "motion-engineering",
			onOpen: vi.fn(),
			onDownload: vi.fn(),
		});

		const title = card.querySelector(".vw-card__title");
		const slug = card.querySelector(".vw-card__slug");
		const badge = card.querySelector(".vw-card__badge");

		expect(title?.textContent).toBe("Demo Title");
		expect(slug?.textContent).toBe("demo_video");
		expect(badge?.textContent).toBe("motion-engineering");
	});

	it("video_card_click_calls_onOpen", () => {
		const onOpen = vi.fn();
		const card = renderVideoCard({
			slug: "s",
			title: "T",
			style: "st",
			onOpen,
			onDownload: vi.fn(),
		});

		card.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(onOpen).toHaveBeenCalledTimes(1);
	});

	it("video_card_enter_key_calls_onOpen", () => {
		const onOpen = vi.fn();
		const card = renderVideoCard({
			slug: "s",
			title: "T",
			style: "st",
			onOpen,
			onDownload: vi.fn(),
		});

		card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
		expect(onOpen).toHaveBeenCalledTimes(1);
	});

	it("video_card_download_icon_stops_propagation", () => {
		const onOpen = vi.fn();
		const onDownload = vi.fn();
		const card = renderVideoCard({
			slug: "s",
			title: "T",
			style: "st",
			onOpen,
			onDownload,
		});

		const dlBtn = card.querySelector(".vw-card__download") as HTMLButtonElement;
		expect(dlBtn).not.toBeNull();

		dlBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(onDownload).toHaveBeenCalledTimes(1);
		// onOpen should NOT be called because stopPropagation prevents it
		expect(onOpen).not.toHaveBeenCalled();
	});

	it("video_card_has_aria_label", () => {
		const card = renderVideoCard({
			slug: "s",
			title: "My Video",
			style: "st",
			onOpen: vi.fn(),
			onDownload: vi.fn(),
		});

		expect(card.getAttribute("aria-label")).toContain("My Video");
	});

	it("video_card_is_focusable", () => {
		const card = renderVideoCard({
			slug: "s",
			title: "T",
			style: "st",
			onOpen: vi.fn(),
			onDownload: vi.fn(),
		});

		expect(card.tabIndex).toBe(0);
	});
});
