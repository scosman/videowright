/**
 * @vitest-environment jsdom
 *
 * Tests that the video view renders a top bar with breadcrumb.
 * Virtual modules are resolved via aliases in vitest.config.ts.
 * Player/dev-frame are mocked to isolate the DOM structure.
 */

import { describe, expect, it, vi } from "vitest";

// Mock virtual modules used by video_view.ts
vi.mock("virtual:vw-globals", () => ({
	timelinePath: "/fake/timeline.ts",
	consumerRoot: "/fake/root",
	audioFile: undefined,
	resolvedTiming: undefined,
	audioTrackNone: true,
	renderFps: undefined,
}));
vi.mock("virtual:vw-segments", () => ({ default: {} }));

// Mock dev_frame to avoid DOM measurement side effects
vi.mock("../../src/cli/entry/dev_frame.js", () => ({
	applyDevFrameSize: vi.fn(),
	installHudKeyListener: vi.fn(() => vi.fn()),
	toggleDevHud: vi.fn(() => true),
}));

// Mock download modal and hide-HUD tab to isolate top bar tests
vi.mock("../../src/cli/entry/components/download_modal.js", () => ({
	renderDownloadModal: vi.fn(() => vi.fn()),
}));
vi.mock("../../src/cli/entry/components/hide_hud_tab.js", () => ({
	renderHideHudTab: vi.fn(() => document.createElement("button")),
}));

// Mock index.js re-exports to provide stubs for the build helpers
vi.mock("../../src/index.js", () => ({
	Player: vi.fn().mockImplementation(() => ({
		load: vi.fn().mockResolvedValue(undefined),
		start: vi.fn().mockResolvedValue(undefined),
	})),
	applyMetaDefaults: vi.fn((t: unknown) => t),
	buildSegmentLoaderMap: vi.fn(() => new Map()),
	buildTransitionLoaderMap: vi.fn(() => new Map()),
	validateTimeline: vi.fn(() => ({ ok: true, errors: [] })),
}));

vi.mock("../../src/timeline/resolveTiming.js", () => ({
	resolveTiming: vi.fn(() => ({ perSegment: {} })),
}));

import { renderVideoView } from "../../src/cli/entry/views/video_view.js";
import type { ProjectInfo } from "../../src/types.js";

const projectInfo: ProjectInfo = {
	projectName: "test-project",
	videos: [
		{
			slug: "demo_video",
			timelinePath: "/videos/demo_video/timeline.ts",
			title: "Demo Title",
			style: "motion-engineering",
			mtimeMs: Date.now(),
		},
		{
			slug: "another",
			timelinePath: "/videos/another/timeline.ts",
			title: "Another Video",
			style: "minimal",
			mtimeMs: Date.now() - 1000,
		},
	],
};

describe("video view top bar", () => {
	it("video_view_has_top_bar_with_breadcrumb", () => {
		const el = renderVideoView(projectInfo, "demo_video");

		const topBar = el.querySelector(".vw-top-bar");
		expect(topBar).not.toBeNull();

		const title = topBar?.querySelector(".vw-top-bar__title");
		expect(title).not.toBeNull();
		expect(title?.textContent).toBe("Demo Title");

		const sep = topBar?.querySelector(".vw-top-bar__sep");
		expect(sep).not.toBeNull();
		expect(sep?.textContent).toBe("/");

		const wordmark = topBar?.querySelector(".vw-top-bar__wordmark");
		expect(wordmark).not.toBeNull();
		expect(wordmark?.textContent).toBe("videowright");
	});

	it("video_view_top_bar_shows_project_name", () => {
		const el = renderVideoView(projectInfo, "demo_video");
		const project = el.querySelector(".vw-top-bar__project");
		expect(project?.textContent).toBe("test-project");
	});

	it("video_view_breadcrumb_uses_correct_video_title", () => {
		const el = renderVideoView(projectInfo, "another");

		const title = el.querySelector(".vw-top-bar__title");
		expect(title?.textContent).toBe("Another Video");
	});

	it("video_view_top_bar_shows_download_icon", () => {
		const el = renderVideoView(projectInfo, "demo_video");
		const dlBtn = el.querySelector(".vw-top-bar__icon-btn");
		expect(dlBtn).not.toBeNull();
		expect(dlBtn?.getAttribute("aria-label")).toBe("Download video");
	});

	it("video_view_has_hide_hud_tab", () => {
		const el = renderVideoView(projectInfo, "demo_video");
		const hudContainer = el.querySelector("#dev-hud-container");
		expect(hudContainer).not.toBeNull();
		// hide_hud_tab.ts is mocked to return a <button>; check it's inside the container
		const button = hudContainer?.querySelector("button");
		expect(button).not.toBeNull();
	});
});
