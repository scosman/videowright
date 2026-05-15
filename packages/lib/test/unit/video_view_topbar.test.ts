/**
 * @vitest-environment jsdom
 *
 * Tests that the video view renders a top bar with breadcrumb.
 * Virtual modules are resolved via aliases in vitest.config.ts.
 * Player/dev-frame are mocked to isolate the DOM structure.
 */

import { describe, expect, it, vi } from "vitest";

// Mock router.navigate
vi.mock("../../src/cli/entry/router.js", () => ({
	navigate: vi.fn(),
}));

// Mock dev_frame to avoid DOM measurement side effects
vi.mock("../../src/cli/entry/dev_frame.js", () => ({
	applyDevFrameSize: vi.fn(),
	installHudKeyListener: vi.fn(() => vi.fn()),
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
});
