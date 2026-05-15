/**
 * 404 page view.
 * Shown when the router cannot match the pathname to a known video or route.
 */

import type { ProjectInfo } from "../../../types.js";
import { renderTopBar } from "../components/top_bar.js";
import { navigate } from "../router.js";

export function renderNotFound(attemptedPath: string, projectInfo: ProjectInfo): HTMLElement {
	const container = document.createElement("main");
	container.className = "vw-not-found";

	// Top bar
	const topBar = renderTopBar({ projectName: projectInfo.projectName });
	container.appendChild(topBar);

	// Content
	const content = document.createElement("div");
	content.className = "vw-not-found__content";

	const code = document.createElement("div");
	code.className = "vw-not-found__code";
	code.textContent = "404";
	content.appendChild(code);

	const heading = document.createElement("h1");
	heading.className = "vw-not-found__heading";
	heading.textContent = "Video not found";
	content.appendChild(heading);

	const desc = document.createElement("p");
	desc.className = "vw-not-found__desc";
	desc.textContent = `No video at ${attemptedPath}`;
	content.appendChild(desc);

	const link = document.createElement("a");
	link.className = "vw-not-found__link";
	link.href = "/";
	link.textContent = "← Back to videos";
	link.addEventListener("click", (e) => {
		e.preventDefault();
		navigate("/");
	});
	content.appendChild(link);

	container.appendChild(content);

	return container;
}
