/**
 * Slot div creation helpers.
 * Each slot is a plain div with inline positioning styles.
 * The slot contains a content div that is passed to segments --
 * this prevents segments from overwriting the slot's critical positioning
 * styles when they set el.style.cssText on their host element.
 */

const SLOT_STYLES = "position:absolute;inset:0;overflow:hidden;";
const CONTENT_STYLES = "width:100%;height:100%;position:relative;";

export function createSlot(label: string): HTMLDivElement {
	const el = document.createElement("div");
	el.className = "vw-slot";
	el.dataset.slot = label;
	el.setAttribute("style", SLOT_STYLES);

	const content = document.createElement("div");
	content.className = "vw-slot-content";
	content.setAttribute("style", CONTENT_STYLES);
	el.appendChild(content);

	return el;
}

/**
 * Get the content div inside a slot, which is the element passed to segment mount().
 */
export function getSlotContent(slot: HTMLDivElement): HTMLDivElement {
	return slot.querySelector(".vw-slot-content") as HTMLDivElement;
}

/**
 * Cancel all WAAPI animations on a slot element.
 * Transition animations use fill:"forwards", which persists transforms on the element
 * even after the transition is logically complete. This must be called before reusing
 * a slot for new content, otherwise stale transforms (e.g. translate(-100%,0)) remain.
 *
 * Gracefully no-ops in environments where getAnimations() is not available (e.g. jsdom).
 */
export function clearSlotAnimations(slot: HTMLDivElement): void {
	if (typeof slot.getAnimations !== "function") return;
	const animations = slot.getAnimations();
	for (const anim of animations) {
		anim.cancel();
	}
}
