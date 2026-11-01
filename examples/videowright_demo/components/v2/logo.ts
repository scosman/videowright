import markSource from "./assets/videowright-mark.svg?raw";
import "./v2.css";
import { draw } from "./motion.js";

// The Videowright logo: the mark (three round-capped gradient strokes, from the bundled SVG)
// and the lowercase Outfit SemiBold wordmark. The mark keeps its own gradients; it is never
// recoloured into the HUD palette.

/** The mark's visible extent in its own viewBox units: the strokes plus their round caps. */
export const MARK_BOUNDS = { x: 41, y: 21, w: 486, h: 294 } as const;

let instances = 0;

export interface Mark {
	el: SVGSVGElement;
	/** In drawing order: down the left of the V, up its right, down the slash. */
	strokes: SVGLineElement[];
}

/**
 * A fresh copy of the mark, sized to `width` px (height follows the aspect). Gradient ids are
 * unique per copy, so two marks can be on the page at once (both slots during a transition).
 */
export function createMark(width: number): Mark {
	const n = ++instances;
	const holder = document.createElement("div");
	holder.innerHTML = markSource
		.replace(/id="(vw-[abc])"/g, `id="$1-${n}"`)
		.replace(/url\(#(vw-[abc])\)/g, `url(#$1-${n})`);
	const el = holder.querySelector("svg") as SVGSVGElement;
	const { x, y, w, h } = MARK_BOUNDS;
	el.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
	el.setAttribute("width", String(width));
	el.setAttribute("height", String((width * h) / w));
	el.classList.add("v2-mark");
	const strokes = ["a", "b", "c"].map((k) => el.querySelector(`.vw-stroke-${k}`) as SVGLineElement);
	// Stroke b is defined top-down; flip it so the V is drawn as a pen would: down, then up.
	const b = strokes[1];
	const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((a) => b.getAttribute(a) ?? "0");
	b.setAttribute("x1", x2);
	b.setAttribute("y1", y2);
	b.setAttribute("x2", x1);
	b.setAttribute("y2", y1);
	return { el, strokes };
}

/** Where a point in the mark's viewBox lands, for a mark of `width` px placed at (left, top). */
export function markPoint(width: number, left: number, top: number, vx: number, vy: number) {
	const k = width / MARK_BOUNDS.w;
	return { x: left + (vx - MARK_BOUNDS.x) * k, y: top + (vy - MARK_BOUNDS.y) * k };
}

/** The V's vertex (where strokes a and b meet), in viewBox units. */
export const MARK_VERTEX = { x: 222, y: 276 } as const;

/**
 * Draws the strokes in, stroke i starting at `starts[i]` ms (negative: already under way).
 * Returns when the last one lands (ms from now).
 */
export function drawMark(
	mark: Mark,
	starts: readonly number[],
	duration = 420,
	// Quick off the mark and long into the end, like a confident pen stroke (and a hard cut
	// lands on a stroke already at speed).
	easing = "cubic-bezier(0.3, 0.4, 0.15, 1)",
): number {
	mark.strokes.forEach((line, i) => {
		draw(line, starts[i] ?? 0, duration, false, easing);
	});
	return Math.max(...starts) + duration;
}

/** Shows the mark fully drawn (no animation). */
export function showMark(mark: Mark): void {
	for (const line of mark.strokes) {
		line.style.strokeDasharray = "";
		line.style.strokeDashoffset = "";
	}
}

/** The lowercase wordmark at `size` px. */
export function createWordmark(size: number): HTMLElement {
	const el = document.createElement("span");
	el.className = "v2-wordmark";
	el.style.fontSize = `${size}px`;
	el.textContent = "videowright";
	return el;
}
