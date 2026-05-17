/**
 * Video card for the homepage grid.
 * An anchor element that navigates to the video page on click.
 */

import { iconDownload } from "./icons.js";

export interface VideoCardProps {
	slug: string;
	title: string;
	style: string;
	onDownload: () => void;
}

export function renderVideoCard(props: VideoCardProps): HTMLElement {
	const card = document.createElement("a") as HTMLAnchorElement;
	card.className = "vw-card";
	card.href = `/video/${props.slug}`;
	card.setAttribute("aria-label", `Open video: ${props.title}`);

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
		e.preventDefault();
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
