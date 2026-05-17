/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { renderTopBar } from "../../src/cli/entry/components/top_bar.js";

describe("renderTopBar", () => {
	it("top_bar_renders_wordmark", () => {
		const bar = renderTopBar({ projectName: "my-project" });
		const wordmark = bar.querySelector(".vw-top-bar__wordmark");
		expect(wordmark).not.toBeNull();
		expect(wordmark?.textContent).toBe("videowright");
	});

	it("top_bar_renders_project_name", () => {
		const bar = renderTopBar({ projectName: "my-project" });
		const project = bar.querySelector(".vw-top-bar__project");
		expect(project).not.toBeNull();
		expect(project?.textContent).toBe("my-project");
	});

	it("top_bar_renders_breadcrumb_when_set", () => {
		const bar = renderTopBar({ projectName: "p", breadcrumbTitle: "Demo Title" });
		const sep = bar.querySelector(".vw-top-bar__sep");
		const title = bar.querySelector(".vw-top-bar__title");
		expect(sep).not.toBeNull();
		expect(sep?.textContent).toBe("/");
		expect(title).not.toBeNull();
		expect(title?.textContent).toBe("Demo Title");
	});

	it("top_bar_no_breadcrumb_on_homepage", () => {
		const bar = renderTopBar({ projectName: "p" });
		const sep = bar.querySelector(".vw-top-bar__sep");
		const title = bar.querySelector(".vw-top-bar__title");
		expect(sep).toBeNull();
		expect(title).toBeNull();
	});

	it("top_bar_wordmark_is_plain_anchor_to_root", () => {
		const bar = renderTopBar({ projectName: "p" });
		const wordmark = bar.querySelector(".vw-top-bar__wordmark") as HTMLAnchorElement;
		expect(wordmark.tagName).toBe("A");
		expect(wordmark.href).toContain("/");
	});

	it("top_bar_shows_download_button_when_enabled", () => {
		const onDownload = vi.fn();
		const bar = renderTopBar({ projectName: "p", showDownload: true, onDownload });
		const btn = bar.querySelector(".vw-top-bar__icon-btn");
		expect(btn).not.toBeNull();

		btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(onDownload).toHaveBeenCalled();
	});

	it("top_bar_hides_download_button_when_disabled", () => {
		const bar = renderTopBar({ projectName: "p", showDownload: false });
		const btn = bar.querySelector(".vw-top-bar__icon-btn");
		expect(btn).toBeNull();
	});

	it("top_bar_has_nav_element", () => {
		const bar = renderTopBar({ projectName: "p" });
		expect(bar.tagName).toBe("NAV");
		expect(bar.className).toBe("vw-top-bar");
	});
});
