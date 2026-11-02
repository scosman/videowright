import {
	MARK_BOUNDS,
	MARK_VERTEX,
	type Mark,
	createMark,
	createWordmark,
	drawMark,
	markPoint,
	showMark,
} from "./logo.js";
import { ms, riseIn } from "./motion.js";
import "./v2.css";

// The beat-2 title composition as a component, so the same title card appears three times:
// full frame in v2-title-card, inside the browser on hot reload (v2-interactive-dev), and in
// the export player (v2-pixel-perfect-export). Laid out on a 1920 x 1080 design canvas and
// scaled as a whole. A horizontal lockup, centred vertically on the grid: the mark on the
// x = 160 major line, the wordmark beside it, the tagline under the wordmark. No HUD
// annotations: the logo is the subject, and it holds still.

/**
 * Where the wordmark's letters wait before they rise: below a mask that is 1.3x their line box
 * (0.3 x the size of descender room, for the "g").
 */
export const WORDMARK_HIDDEN = "translateY(135%)";

/** The mark at 0.885 px per unit of its viewBox (the scale the lockup was drawn at). */
const MARK_SCALE = 430 / 486;

export const LOCKUP = {
	mark: { left: 160, top: 340, width: Math.round(MARK_BOUNDS.w * MARK_SCALE) },
	/** 80px right of the mark's right edge (its slash's cap). */
	wordmark: { left: 640, top: 366, size: 200 },
	/** Under the wordmark's "v" (its left side bearing). */
	tagline: { left: 650, top: 646 },
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
	tagline: 760,
} as const;

export interface TitleLockup {
	root: HTMLElement;
	mark: Mark;
	/** The V's vertex, design px. */
	vertex: { x: number; y: number };
	/** Plays the whole reveal: strokes, wordmark, tagline. */
	reveal(): void;
	/** The strokes draw. */
	revealMark(): void;
	/** The wordmark rises letter by letter, `delay` ms from now. */
	revealWords(delay?: number): void;
	/** The tagline rises, `delay` ms from now. */
	revealTagline(delay?: number): void;
	/** The settled lockup, no animation. */
	showFinal(): void;
}

export interface LockupOptions {
	/** Uniform scale of the 1920 x 1080 canvas (default 1). */
	scale?: number;
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
	// The mask's usual 0.12em of descender room is short of Outfit's g. In px of the
	// wordmark's own size: an em here would resolve against the wrapper's inherited size.
	wordLine.style.paddingBottom = `${0.3 * w.size}px`;
	wordLine.style.marginBottom = `${-0.3 * w.size}px`;
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

	const vertex = markPoint(m.width, m.left, m.top, MARK_VERTEX.x, MARK_VERTEX.y);

	// The wordmark's mask is 1.3x its letters' line box (its descender room), so the letters wait
	// further down than the usual 112%, or their tops would show under the mask before they rise.
	for (const el of letters) el.style.transform = WORDMARK_HIDDEN;
	taglineInner.style.transform = "translateY(112%)";

	const revealMark = () => {
		drawMark(mark, REVEAL.strokes);
	};
	const revealWords = (delay = 0) => {
		riseIn(letters, delay, ms("--dur-slow"), 18, WORDMARK_HIDDEN);
	};
	const revealTagline = (delay = 0) => {
		riseIn([taglineInner], delay);
	};

	return {
		root,
		mark,
		vertex,
		revealMark,
		revealWords,
		revealTagline,
		reveal() {
			revealMark();
			revealWords(REVEAL.wordmark);
			revealTagline(REVEAL.tagline);
		},
		showFinal() {
			showMark(mark);
			for (const el of [...letters, taglineInner]) el.style.transform = "";
		},
	};
}
