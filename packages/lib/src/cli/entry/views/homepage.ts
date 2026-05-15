/**
 * Homepage view.
 * Shows a grid of video cards, or the empty-state panel when no videos exist.
 */

import type { ProjectInfo } from "../../../types.js";
import { renderEmptyState } from "../components/empty_state.js";
import { renderTopBar } from "../components/top_bar.js";
import { renderVideoCard } from "../components/video_card.js";
import { navigate } from "../router.js";

export function renderHomepage(projectInfo: ProjectInfo): HTMLElement {
	const container = document.createElement("main");
	container.className = "vw-homepage";

	// Top bar
	const topBar = renderTopBar({ projectName: projectInfo.projectName });
	container.appendChild(topBar);

	// Empty state
	if (projectInfo.videos.length === 0) {
		container.appendChild(renderEmptyState());
		return container;
	}

	// Content area
	const content = document.createElement("div");
	content.className = "vw-homepage__content";

	// Section heading
	const heading = document.createElement("h1");
	heading.className = "vw-homepage__heading";
	heading.textContent = "Videos";
	content.appendChild(heading);

	const subtitle = document.createElement("p");
	subtitle.className = "vw-homepage__subtitle";
	const count = projectInfo.videos.length;
	subtitle.textContent = `${count} ${count === 1 ? "video" : "videos"} in this project`;
	content.appendChild(subtitle);

	// Card grid
	const grid = document.createElement("div");
	grid.className = "vw-homepage__grid";

	for (const video of projectInfo.videos) {
		const card = renderVideoCard({
			slug: video.slug,
			title: video.title,
			style: video.style,
			onOpen: () => navigate(`/${video.slug}/`),
			onDownload: () => {
				// Download modal wiring comes in Phase 3
			},
		});
		grid.appendChild(card);
	}

	content.appendChild(grid);
	container.appendChild(content);

	return container;
}
