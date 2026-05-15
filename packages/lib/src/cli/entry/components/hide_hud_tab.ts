/**
 * Hide-HUD tab: a small clickable tab anchored to the top edge of the HUD
 * strip. Click toggles HUD visibility; chevron icon indicates direction.
 */

import { iconChevronDown, iconChevronUp } from "./icons.js";

export interface HideHudTabProps {
	onToggle: () => boolean; // returns new visibility state
}

/**
 * Create the hide-HUD tab element.
 * The tab starts in the "HUD visible" state (chevron down = collapse).
 */
export function renderHideHudTab(props: HideHudTabProps): HTMLElement {
	const tab = document.createElement("button");
	tab.className = "vw-hide-hud-tab";
	tab.type = "button";
	tab.setAttribute("aria-label", "Toggle HUD");

	let hudVisible = true;

	function updateIcon(): void {
		tab.innerHTML = hudVisible ? iconChevronDown() : iconChevronUp();
	}

	updateIcon();

	tab.addEventListener("click", (e) => {
		e.stopPropagation();
		hudVisible = props.onToggle();
		updateIcon();
	});

	return tab;
}
