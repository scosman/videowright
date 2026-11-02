import type { Box } from "./stage.js";

// The video's one match cut: the agents beat (7) ends on a single outline that settles onto the
// end card's prompt box, and the end card (8) opens on a hard cut with that box and outline in
// place: "any agent → your agent's input box". The two beats share these.

/**
 * The end card's prompt box (stage px): the matched shape. The end card's logo and this box
 * are centred on the frame as a group (END_CARD_SHIFT below their original layout).
 */
export const END_CARD_SHIFT = 108;
export const END_CARD_BOX: Box = { x: 160, y: 404 + END_CARD_SHIFT, w: 1600, h: 300 };
/** The end card's key light; the agents beat's light glides to it before the cut. */
export const END_CARD_KEY = { x: 760, y: 470 + END_CARD_SHIFT } as const;
/** The agents beat's grid-scan phase (ms); the end card carries it on across the cut. */
export const AGENTS_SCAN_PHASE = 900;

/**
 * The matched outline: one --hairline-strong rounded rect over `box`, in the stage's content
 * layer (under the camera, which is at identity at the cut). Both beats draw it the same way,
 * so the cut lands on identical pixels.
 */
export function matchOutline(parent: HTMLElement, box: Box): HTMLElement {
	const el = document.createElement("div");
	el.style.cssText = `position:absolute; left:${box.x}px; top:${box.y}px; width:${box.w}px; height:${box.h}px; box-sizing:border-box; border:1.5px solid var(--hairline-strong); border-radius:var(--radius-md); pointer-events:none`;
	parent.appendChild(el);
	return el;
}

/** The key light's background position for a pool centred on (x, y) (tokens.css: a 1400 × 1000 pool). */
export const keyAt = (p: { x: number; y: number }) => `${p.x - 700}px ${p.y - 500}px`;
