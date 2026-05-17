/**
 * Dev preview frame sizing and scale-to-fit logic.
 *
 * Sets #player-host to the native target resolution and applies a CSS
 * transform to scale the frame down to fit the video area above the HUD.
 * The inner DOM renders at full native resolution so the preview matches
 * render output pixel-for-pixel.
 *
 * NOTE: This module is dev-entry-only. It is imported by the video page
 * entry (entry_video.ts) and should NOT be imported in non-dev contexts
 * (SSR, production builds, etc.).
 */

/** Padding inside the video area (each side). Kept small so the video fills more space. */
export const VIDEO_AREA_PADDING = 12;

/** Fixed height of the HUD strip at the bottom of the viewport.
 *  Must match the CSS `height` on `#dev-hud-container` in index.html. */
export const HUD_HEIGHT = 80;

/** Whether the HUD strip is currently visible. */
let hudVisible = true;

/**
 * Returns HUD_HEIGHT when the HUD is visible, 0 when hidden.
 * Used by the scale computation so the video area grows when the HUD is toggled off.
 */
export function getCurrentHudHeight(): number {
	return hudVisible ? HUD_HEIGHT : 0;
}

/**
 * Compute the scale factor to fit `width x height` into available space.
 * Never upscales (clamped to 1). Returns 1 if available space is non-positive.
 */
export function computeScale(
	targetWidth: number,
	targetHeight: number,
	availableWidth: number,
	availableHeight: number,
): number {
	if (availableWidth <= 0 || availableHeight <= 0) return 1;
	return Math.min(availableWidth / targetWidth, availableHeight / targetHeight, 1);
}

/** Stored reference to the scale-update function, set by applyDevFrameSize.
 *  Also used by toggleDevHud to recompute scale when the HUD is toggled. */
let updateScaleFn: (() => void) | null = null;

/**
 * Toggle the HUD strip visibility. When hidden, the video area grows to fill
 * the freed space and the scale factor is recomputed. The grid template
 * switches between `auto 1fr 80px` (visible) and `0 1fr 0px` (hidden),
 * collapsing both the nav row and HUD row so the video uses full height.
 * The top bar (.vw-top-bar) is also hidden/shown in sync.
 *
 * Returns the new visibility state.
 */
export function toggleDevHud(): boolean {
	hudVisible = !hudVisible;

	const layout = document.getElementById("dev-layout");
	const hudContainer = document.getElementById("dev-hud-container");

	// Toggle the top bar visibility.
	// IMPORTANT: Do NOT use display:none — that removes the element from the
	// grid flow, causing subsequent grid items to shift into the wrong tracks.
	// Instead use visibility:hidden + overflow:hidden so it stays in its grid
	// track (which is collapsed to height 0 via grid-template-rows).
	const topBar = layout?.querySelector(".vw-top-bar") as HTMLElement | null;
	if (topBar) {
		if (hudVisible) {
			topBar.style.visibility = "";
			topBar.style.overflow = "";
		} else {
			topBar.style.visibility = "hidden";
			topBar.style.overflow = "hidden";
		}
	}

	if (layout) {
		layout.style.gridTemplateRows = hudVisible ? "auto 1fr 80px" : "0 1fr 0px";
	}
	if (hudContainer) {
		// Hide only the inner HUD content (.vw-hud), NOT the container itself.
		// The container must stay visible (with overflow:visible) so the
		// hide-HUD tab — positioned at top:-8px — remains accessible when
		// the HUD strip is collapsed.
		const hudContent = hudContainer.querySelector(".vw-hud") as HTMLElement | null;
		if (hudContent) {
			hudContent.style.display = hudVisible ? "" : "none";
		}
	}

	// Recompute scale with the new available height
	if (updateScaleFn) updateScaleFn();

	return hudVisible;
}

/**
 * Reset internal HUD visibility state. Intended for tests only.
 */
export function _resetHudVisible(): void {
	hudVisible = true;
	updateScaleFn = null;
}

/**
 * Measure the current height of the nav bar inside #dev-layout, if present.
 * Returns 0 when there is no nav element (e.g., non-video views).
 */
function getNavHeight(): number {
	const nav = document.querySelector("#dev-layout > nav");
	if (!nav) return 0;
	return (nav as HTMLElement).offsetHeight || 0;
}

/**
 * Apply native resolution to #player-host and scale-to-fit the video area.
 * Attaches a resize listener to keep the scale updated.
 *
 * The available space for the frame is:
 *   width:  viewport width  - 2 * VIDEO_AREA_PADDING
 *   height: viewport height - getNavHeight() - getCurrentHudHeight() - 2 * VIDEO_AREA_PADDING
 *
 * getCurrentHudHeight() returns HUD_HEIGHT when the HUD is visible, 0 when
 * hidden, so the scale recomputes correctly when the HUD is toggled.
 * getNavHeight() measures the nav bar introduced by the multi-video layout.
 *
 * Expects the DOM to contain:
 * - `#player-host` — the rendering surface
 * - `#dev-scale-container` — wrapper that receives scaled dimensions
 */
export function applyDevFrameSize(resolution: [number, number]): void {
	const [width, height] = resolution;
	const host = document.getElementById("player-host");
	const scaleContainer = document.getElementById("dev-scale-container");
	if (!host || !scaleContainer) return;

	host.style.width = `${width}px`;
	host.style.height = `${height}px`;

	const updateScale = () => {
		const availableW = window.innerWidth - VIDEO_AREA_PADDING * 2;
		const availableH =
			window.innerHeight - getNavHeight() - getCurrentHudHeight() - VIDEO_AREA_PADDING * 2;

		const scale = computeScale(width, height, availableW, availableH);
		host.style.transform = `scale(${scale})`;
		scaleContainer.style.width = `${width * scale}px`;
		scaleContainer.style.height = `${height * scale}px`;
	};

	updateScaleFn = updateScale;
	updateScale();
	// Called once per page load in MPA mode; no listener cleanup needed since
	// the page is torn down on navigation.
	window.addEventListener("resize", updateScale);
}

/**
 * Install the "H" key listener for toggling HUD visibility.
 * Ignores key events when the target is an input, textarea, or
 * contenteditable element. Called once during dev boot (MPA page load).
 *
 * Returns a cleanup function that removes the listener.
 */
export function installHudKeyListener(): () => void {
	const handler = (e: KeyboardEvent) => {
		if (e.key !== "h" && e.key !== "H") return;
		// Ignore when typing in form fields or contenteditable
		const target = e.target as HTMLElement | null;
		if (target) {
			const tag = target.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (target.isContentEditable || target.contentEditable === "true") return;
		}
		toggleDevHud();
	};

	// Called once per page load in MPA mode; no dedup guard needed since
	// the page is torn down on navigation.
	document.addEventListener("keydown", handler);

	return () => {
		document.removeEventListener("keydown", handler);
	};
}
