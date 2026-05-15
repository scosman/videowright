/**
 * Video card for the homepage grid.
 * Clickable card with title, slug, style badge, and download icon.
 */

import { iconDownload } from "./icons.js";

export interface VideoCardProps {
	slug: string;
	title: string;
	style: string;
	onOpen: () => void;
	onDownload: () => void;
}

export function renderVideoCard(props: VideoCardProps): HTMLElement {
	const card = document.createElement("article");
	card.className = "vw-card";
	card.tabIndex = 0;
	card.setAttribute("role", "link");
	card.setAttribute("aria-label", `Open video: ${props.title}`);

	// Click anywhere on the card opens the video
	card.addEventListener("click", () => props.onOpen());
	card.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			props.onOpen();
		}
	});

	// Header row: title + download icon
	const header = document.createElement("div");
	header.className = "vw-card__header";

	const title = document.createElement("div");
	title.className = "vw-card__title";
	title.textContent = props.title;
	header.appendChild(title);

	const dlBtn = document.createElement("button");
	dlBtn.className = "vw-card__download";
	dlBtn.type = "button";
	dlBtn.setAttribute("aria-label", `Download ${props.title}`);
	dlBtn.innerHTML = iconDownload();
	dlBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		props.onDownload();
	});
	header.appendChild(dlBtn);

	card.appendChild(header);

	// Slug
	const slug = document.createElement("div");
	slug.className = "vw-card__slug";
	slug.textContent = props.slug;
	card.appendChild(slug);

	// Style badge
	const badge = document.createElement("div");
	badge.className = "vw-card__badge";
	badge.textContent = props.style;
	card.appendChild(badge);

	return card;
}
