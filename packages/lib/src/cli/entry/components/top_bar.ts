/**
 * Top bar component shared across all pages.
 * 56px tall, dark surface background, bottom border.
 */

import { iconDownload } from "./icons.js";

export interface TopBarProps {
	projectName: string;
	breadcrumbTitle?: string;
	showDownload?: boolean;
	onDownload?: () => void;
}

export function renderTopBar(props: TopBarProps): HTMLElement {
	const bar = document.createElement("nav");
	bar.className = "vw-top-bar";
	bar.setAttribute("aria-label", "Top navigation");

	const left = document.createElement("div");
	left.className = "vw-top-bar__left";

	// Wordmark -- plain link home
	const wordmark = document.createElement("a");
	wordmark.className = "vw-top-bar__wordmark";
	wordmark.href = "/";
	wordmark.textContent = "videowright";
	left.appendChild(wordmark);

	// Breadcrumb separator + title (video view)
	if (props.breadcrumbTitle) {
		const sep = document.createElement("span");
		sep.className = "vw-top-bar__sep";
		sep.textContent = "/";
		left.appendChild(sep);

		const title = document.createElement("span");
		title.className = "vw-top-bar__title";
		title.textContent = props.breadcrumbTitle;
		left.appendChild(title);
	}

	bar.appendChild(left);

	const right = document.createElement("div");
	right.className = "vw-top-bar__right";

	// Download button (when enabled)
	if (props.showDownload && props.onDownload) {
		const dlBtn = document.createElement("button");
		dlBtn.className = "vw-top-bar__icon-btn";
		dlBtn.type = "button";
		dlBtn.setAttribute("aria-label", "Download video");
		dlBtn.innerHTML = iconDownload();
		const handler = props.onDownload;
		dlBtn.addEventListener("click", () => handler());
		right.appendChild(dlBtn);
	}

	// Project name
	const projectName = document.createElement("span");
	projectName.className = "vw-top-bar__project";
	projectName.textContent = props.projectName;
	right.appendChild(projectName);

	bar.appendChild(right);

	return bar;
}
