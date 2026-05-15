/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { renderNotFound } from "../../src/cli/entry/views/not_found.js";
import type { ProjectInfo } from "../../src/types.js";

// Mock router.navigate
vi.mock("../../src/cli/entry/router.js", () => ({
	navigate: vi.fn(),
}));

const projectInfo: ProjectInfo = {
	projectName: "test-project",
	videos: [],
};

describe("renderNotFound", () => {
	it("not_found_renders_attempted_path", () => {
		const el = renderNotFound("/broken_slug/", projectInfo);
		expect(el.textContent).toContain("/broken_slug/");
	});

	it("not_found_shows_404_code", () => {
		const el = renderNotFound("/bad/", projectInfo);
		expect(el.textContent).toContain("404");
	});

	it("not_found_shows_heading", () => {
		const el = renderNotFound("/bad/", projectInfo);
		expect(el.textContent).toContain("Video not found");
	});

	it("not_found_has_back_link", () => {
		const el = renderNotFound("/bad/", projectInfo);
		const link = el.querySelector(".vw-not-found__link") as HTMLAnchorElement;
		expect(link).not.toBeNull();
		expect(link?.href).toContain("/");
		expect(link?.textContent).toContain("Back to videos");
	});

	it("not_found_has_top_bar", () => {
		const el = renderNotFound("/bad/", projectInfo);
		const topBar = el.querySelector(".vw-top-bar");
		expect(topBar).not.toBeNull();
	});

	it("not_found_top_bar_shows_project_name", () => {
		const el = renderNotFound("/bad/", projectInfo);
		const project = el.querySelector(".vw-top-bar__project");
		expect(project?.textContent).toBe("test-project");
	});
});
