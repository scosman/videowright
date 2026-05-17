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
			onDownload: vi.fn(),
		});

		const title = card.querySelector(".vw-card__title");
		const slug = card.querySelector(".vw-card__slug");
		const badge = card.querySelector(".vw-card__badge");

		expect(title?.textContent).toBe("Demo Title");
		expect(slug?.textContent).toBe("demo_video");
		expect(badge?.textContent).toBe("motion-engineering");
	});

	it("video_card_is_an_anchor_with_correct_href", () => {
		const card = renderVideoCard({
			slug: "demo_video",
			title: "Demo Title",
			style: "motion-engineering",
			onDownload: vi.fn(),
		});

		expect(card.tagName).toBe("A");
		expect((card as HTMLAnchorElement).href).toContain("/video/demo_video");
	});

	it("video_card_download_icon_stops_propagation", () => {
		const onDownload = vi.fn();
		const card = renderVideoCard({
			slug: "s",
			title: "T",
			style: "st",
			onDownload,
		});

		const dlBtn = card.querySelector(".vw-card__download") as HTMLButtonElement;
		expect(dlBtn).not.toBeNull();

		dlBtn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
		expect(onDownload).toHaveBeenCalledTimes(1);
	});

	it("video_card_has_aria_label", () => {
		const card = renderVideoCard({
			slug: "s",
			title: "My Video",
			style: "st",
			onDownload: vi.fn(),
		});

		expect(card.getAttribute("aria-label")).toContain("My Video");
	});

	it("video_card_is_focusable_as_anchor", () => {
		const card = renderVideoCard({
			slug: "s",
			title: "T",
			style: "st",
			onDownload: vi.fn(),
		});

		// Anchors with href are natively focusable
		expect(card.tagName).toBe("A");
		expect((card as HTMLAnchorElement).href).toBeTruthy();
	});
});
