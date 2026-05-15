/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { renderHomepage } from "../../src/cli/entry/views/homepage.js";
import type { ProjectInfo, VideoSummary } from "../../src/types.js";

// Mock router.navigate to avoid actual history API calls
vi.mock("../../src/cli/entry/router.js", () => ({
	navigate: vi.fn(),
}));

// Mock download modal
vi.mock("../../src/cli/entry/components/download_modal.js", () => ({
	renderDownloadModal: vi.fn(() => vi.fn()),
}));

function makeVideo(overrides: Partial<VideoSummary> = {}): VideoSummary {
	return {
		slug: "demo_video",
		timelinePath: "/videos/demo_video/timeline.ts",
		title: "Demo Title",
		style: "motion-engineering",
		mtimeMs: Date.now(),
		...overrides,
	};
}

function makeProjectInfo(videos: VideoSummary[] = []): ProjectInfo {
	return {
		projectName: "my-project",
		videos,
	};
}

describe("renderHomepage", () => {
	it("homepage_renders_empty_state", () => {
		const el = renderHomepage(makeProjectInfo([]));
		const hero = el.querySelector(".vw-empty__hero");
		expect(hero).not.toBeNull();
		expect(hero?.textContent).toBe("No videos yet");
	});

	it("homepage_renders_top_bar", () => {
		const el = renderHomepage(makeProjectInfo([]));
		const topBar = el.querySelector(".vw-top-bar");
		expect(topBar).not.toBeNull();
	});

	it("homepage_renders_video_cards", () => {
		const videos = [
			makeVideo({ slug: "alpha", title: "Alpha Video" }),
			makeVideo({ slug: "beta", title: "Beta Video" }),
			makeVideo({ slug: "gamma", title: "Gamma Video" }),
		];
		const el = renderHomepage(makeProjectInfo(videos));

		const cards = el.querySelectorAll(".vw-card");
		expect(cards).toHaveLength(3);

		const titles = el.querySelectorAll(".vw-card__title");
		expect(titles[0]?.textContent).toBe("Alpha Video");
		expect(titles[1]?.textContent).toBe("Beta Video");
		expect(titles[2]?.textContent).toBe("Gamma Video");
	});

	it("homepage_card_count_subtitle_plural", () => {
		const videos = [makeVideo({ slug: "a", title: "A" }), makeVideo({ slug: "b", title: "B" })];
		const el = renderHomepage(makeProjectInfo(videos));
		const subtitle = el.querySelector(".vw-homepage__subtitle");
		expect(subtitle?.textContent).toBe("2 videos in this project");
	});

	it("homepage_card_count_subtitle_singular", () => {
		const videos = [makeVideo({ slug: "a", title: "A" })];
		const el = renderHomepage(makeProjectInfo(videos));
		const subtitle = el.querySelector(".vw-homepage__subtitle");
		expect(subtitle?.textContent).toBe("1 video in this project");
	});

	it("homepage_card_click_navigates", async () => {
		const { navigate } = await import("../../src/cli/entry/router.js");
		const videos = [makeVideo({ slug: "demo_video", title: "Demo" })];
		const el = renderHomepage(makeProjectInfo(videos));

		const card = el.querySelector(".vw-card") as HTMLElement;
		card.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		expect(navigate).toHaveBeenCalledWith("/demo_video/");
	});

	it("homepage_renders_grid", () => {
		const videos = [makeVideo()];
		const el = renderHomepage(makeProjectInfo(videos));
		const grid = el.querySelector(".vw-homepage__grid");
		expect(grid).not.toBeNull();
	});

	it("homepage_no_grid_when_empty", () => {
		const el = renderHomepage(makeProjectInfo([]));
		const grid = el.querySelector(".vw-homepage__grid");
		expect(grid).toBeNull();
	});

	it("homepage_renders_heading", () => {
		const videos = [makeVideo()];
		const el = renderHomepage(makeProjectInfo(videos));
		const heading = el.querySelector(".vw-homepage__heading");
		expect(heading?.textContent).toBe("Videos");
	});

	it("homepage_download_icon_opens_modal", async () => {
		const { renderDownloadModal } = await import(
			"../../src/cli/entry/components/download_modal.js"
		);
		const videos = [makeVideo({ slug: "my_vid", title: "My Video" })];
		const el = renderHomepage(makeProjectInfo(videos));

		const dlBtn = el.querySelector(".vw-card__download") as HTMLButtonElement;
		dlBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

		expect(renderDownloadModal).toHaveBeenCalledWith(
			expect.objectContaining({ slug: "my_vid", title: "My Video" }),
		);
	});
});
