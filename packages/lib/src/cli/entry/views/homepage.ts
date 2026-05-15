/**
 * Homepage view (placeholder for Phase 1).
 * Shows a list of video slugs as links. Full design comes in Phase 2.
 */

import type { ProjectInfo } from "../../../types.js";
import { navigate } from "../router.js";

export function renderHomepage(projectInfo: ProjectInfo): HTMLElement {
	const container = document.createElement("main");
	container.className = "vw-homepage";
	container.setAttribute(
		"style",
		[
			"min-height: 100vh",
			"font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif",
			"color: var(--text-primary, #f5f5f7)",
			"background: var(--bg-base, #0a0a0b)",
			"padding: 32px",
		].join(";"),
	);

	const heading = document.createElement("h1");
	heading.setAttribute(
		"style",
		["font-size: 24px", "font-weight: 600", "margin: 0 0 8px 0", "line-height: 1.3"].join(";"),
	);
	heading.textContent = "Videos";
	container.appendChild(heading);

	const subtitle = document.createElement("p");
	subtitle.setAttribute(
		"style",
		["font-size: 12px", "color: var(--text-secondary, #a0a0a8)", "margin: 0 0 24px 0"].join(";"),
	);
	const videoWord = projectInfo.videos.length === 1 ? "video" : "videos";
	subtitle.textContent = `${projectInfo.videos.length} ${videoWord} in this project`;
	container.appendChild(subtitle);

	if (projectInfo.videos.length === 0) {
		const empty = document.createElement("p");
		empty.setAttribute(
			"style",
			["font-size: 14px", "color: var(--text-secondary, #a0a0a8)"].join(";"),
		);
		empty.textContent =
			"No videos yet. Ask your coding agent to create one (e.g., /videowright new video).";
		container.appendChild(empty);
		return container;
	}

	const list = document.createElement("ul");
	list.setAttribute(
		"style",
		[
			"list-style: none",
			"padding: 0",
			"margin: 0",
			"display: flex",
			"flex-direction: column",
			"gap: 8px",
		].join(";"),
	);

	for (const video of projectInfo.videos) {
		const item = document.createElement("li");
		const link = document.createElement("a");
		link.href = `/${video.slug}/`;
		link.setAttribute(
			"style",
			[
				"color: var(--accent, #a78bfa)",
				"text-decoration: none",
				"font-size: 16px",
				"display: block",
				"padding: 12px 16px",
				"background: var(--bg-surface, #131316)",
				"border: 1px solid var(--border-subtle, #26262d)",
				"border-radius: 10px",
				"cursor: pointer",
			].join(";"),
		);
		link.addEventListener("click", (e) => {
			e.preventDefault();
			navigate(`/${video.slug}/`);
		});

		const title = document.createElement("div");
		title.setAttribute("style", "color: var(--text-primary, #f5f5f7); font-weight: 500;");
		title.textContent = video.title;
		link.appendChild(title);

		const slug = document.createElement("div");
		slug.setAttribute(
			"style",
			[
				"font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
				"font-size: 13px",
				"color: var(--text-secondary, #a0a0a8)",
				"margin-top: 4px",
			].join(";"),
		);
		slug.textContent = video.slug;
		link.appendChild(slug);

		item.appendChild(link);
		list.appendChild(item);
	}

	container.appendChild(list);
	return container;
}
