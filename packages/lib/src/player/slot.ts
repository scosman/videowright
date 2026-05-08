/**
 * Slot div creation helpers.
 * Each slot is a plain div with inline positioning styles.
 */

const SLOT_STYLES = "position:absolute;inset:0;overflow:hidden;";

export function createSlot(label: string): HTMLDivElement {
	const el = document.createElement("div");
	el.className = "vw-slot";
	el.dataset.slot = label;
	el.setAttribute("style", SLOT_STYLES);
	return el;
}
