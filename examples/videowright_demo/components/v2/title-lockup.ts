import { dimension, lockOn, registerOn } from "./hud.js";
import {
	MARK_VERTEX,
	type Mark,
	createMark,
	createWordmark,
	drawMark,
	markPoint,
	showMark,
} from "./logo.js";
import { type Ticker, css, ms, riseIn, svg } from "./motion.js";
import type { Box } from "./stage.js";
import "./v2.css";

// The beat-2 title composition as a component, so the same title card appears three times:
// full frame in v2-title-card, inside the browser on hot reload (v2-interactive-dev), and in
// the export player (v2-pixel-perfect-export). Laid out on a 1920 x 1080 design canvas and
// scaled as a whole. A horizontal lockup on the safe frame: the mark on the x = 160 major
// line, the wordmark on the 500 grid line, the tagline under the wordmark.

export const LOCKUP = {
	mark: { left: 160, top: 300, width: 430 },
	wordmark: { left: 670, top: 326, size: 200 },
	tagline: { left: 680, top: 606 },
	/** The dimension line's y, below the tagline. */
	dimY: 800,
} as const;

/** Beat timings inside reveal(), in ms from its start. */
export const REVEAL = {
	/**
	 * Each stroke's start. The first starts 140ms early, so a hard cut lands on a stroke already
	 * most of the way down; each later one starts just before the previous one lands, so the
	 * pen never stops, like one gesture.
	 */
	strokes: [-140, 120, 350],
	wordmark: 260,
	lock: 640,
	tagline: 760,
	corners: 1000,
	measure: 1380,
} as const;

export interface Annotations {
	strokes: SVGGeometryElement[];
	marks: Element[];
}

export interface TitleLockup {
	root: HTMLElement;
	mark: Mark;
	/** The logo's box (mark + wordmark), design px. */
	logoBox(): Box;
	/** The whole lockup's box (logo + tagline), design px. */
	lockupBox(): Box;
	/** The V's vertex, design px: where the crosshair locks. */
	vertex: { x: number; y: number };
	/** Plays the whole reveal. Returns the HUD annotations, for release(). */
	reveal(ticker: Ticker): Annotations;
	/** The first half on its own: the strokes draw and the crosshair locks on the vertex. */
	revealMark(): Element[];
	/** The second half, `delay` ms from now: wordmark, tagline, corners, dimension. */
	revealWords(ticker: Ticker, delay?: number): Annotations;
	/** The settled lockup, no animation and no annotations. */
	showFinal(): void;
}

export interface LockupOptions {
	/** Uniform scale of the 1920 x 1080 canvas (default 1). */
	scale?: number;
	/**
	 * Draw the HUD's labels (the dimension's value). Default: at scale 1 and up only. A lockup
	 * inside an already scaled-down stage (a browser preview) passes false: its labels would
	 * land under the 22px floor on screen.
	 */
	labels?: boolean;
}

export function createTitleLockup(host: HTMLElement, opts: LockupOptions = {}): TitleLockup {
	const scale = opts.scale ?? 1;
	const root = document.createElement("div");
	root.className = "v2-lockup";
	root.style.cssText = `position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:0 0; transform:scale(${scale})`;
	host.appendChild(root);

	const { mark: m, wordmark: w, tagline: tg } = LOCKUP;
	const mark = createMark(m.width);
	mark.el.style.left = `${m.left}px`;
	mark.el.style.top = `${m.top}px`;
	root.appendChild(mark.el);

	const word = document.createElement("div");
	word.style.cssText = `position:absolute; left:${w.left}px; top:${w.top}px`;
	const wordLine = document.createElement("span");
	wordLine.className = "me-line";
	// The mask's usual 0.12em of descender room is short of Outfit's g.
	wordLine.style.paddingBottom = "0.3em";
	wordLine.style.marginBottom = "-0.3em";
	const wordmark = createWordmark(w.size);
	// One span per letter, so the wordmark rises letter by letter out of its mask.
	wordmark.innerHTML = [...(wordmark.textContent ?? "")].map((ch) => `<span>${ch}</span>`).join("");
	wordLine.appendChild(wordmark);
	word.appendChild(wordLine);
	root.appendChild(word);
	const letters = [...wordmark.children] as HTMLElement[];
	for (const l of letters) l.style.display = "inline-block";

	const tagline = document.createElement("div");
	tagline.className = "me-h2";
	tagline.style.cssText = `position:absolute; left:${tg.left}px; top:${tg.top}px; color:var(--fg-2); white-space:nowrap`;
	tagline.innerHTML = `<span class="me-line"><span>Build videos in <span style="color:var(--color-fg)">Claude Code</span></span></span>`;
	root.appendChild(tagline);
	const taglineInner = tagline.querySelector(".me-line > span") as HTMLElement;

	const annot = svg(root, "svg", { class: "me-svg", viewBox: "0 0 1920 1080" });

	const vertex = markPoint(m.width, m.left, m.top, MARK_VERTEX.x, MARK_VERTEX.y);
	const logoBox = (): Box => {
		const right = w.left + wordmark.offsetLeft + wordmark.offsetWidth;
		return { x: m.left, y: m.top, w: right - m.left, h: mark.el.height.baseVal.value };
	};
	const lockupBox = (): Box => {
		const logo = logoBox();
		return { ...logo, h: tg.top + tagline.offsetHeight - logo.y };
	};
	// Labels at a reduced scale would fall below the 22px legibility floor: draw strokes only.
	const labels = opts.labels ?? scale >= 1;

	const hide = () => {
		for (const el of [...letters, taglineInner]) el.style.transform = "translateY(112%)";
	};
	hide();

	let lock: SVGGElement | null = null;
	const revealMark = () => {
		drawMark(mark, REVEAL.strokes);
		lock = lockOn(annot, vertex.x, vertex.y, REVEAL.lock);
		return [lock];
	};
	const revealWords = (ticker: Ticker, delay = 0): Annotations => {
		const at = (beat: number) => delay + beat - REVEAL.wordmark;
		riseIn(letters, at(REVEAL.wordmark), ms("--dur-slow"), 18);
		riseIn([taglineInner], at(REVEAL.tagline));
		const box = lockupBox();
		const corners = registerOn(annot, box, at(REVEAL.corners), 26);
		const dim = dimension(
			annot,
			ticker,
			{ x0: box.x, x1: box.x + box.w, y: LOCKUP.dimY, from: box.y + box.h + 48 },
			at(REVEAL.measure),
			labels,
		);
		// The crosshair hands the subject to the corners: it lets go once they have locked.
		lock?.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: ms("--dur-normal"),
			delay: at(REVEAL.corners) + 900,
			easing: css("--ease-exit"),
			fill: "forwards",
		});
		return { strokes: dim.strokes, marks: [...corners, ...dim.marks] };
	};

	return {
		root,
		mark,
		logoBox,
		lockupBox,
		vertex,
		revealMark,
		revealWords,
		reveal(ticker) {
			revealMark();
			return revealWords(ticker, REVEAL.wordmark);
		},
		showFinal() {
			showMark(mark);
			for (const el of [...letters, taglineInner]) el.style.transform = "";
		},
	};
}
