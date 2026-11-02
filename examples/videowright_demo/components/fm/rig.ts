import { css, ms } from "../v2/motion.js";
import { sweepReveal } from "../v2/sweep.js";
import "./rig.css";

// The Then/Now comparison rig for 2026_11_five_months. Every pair draws the same rig at the
// same pixels, so a hard cut between pairs changes only the footage: the window, the rail and
// the caption row never move. Then → Now is one gesture: the cyan beam crosses the window and
// reveals Now behind it (like a progress bar), while the rail's marker travels THEN → NOW in
// lockstep, the window border turns amber behind the beam and the caption swaps at the
// midpoint.

export const RIG = {
	/** The footage window: exactly 0.75× of a 1920×1080 source, centred. */
	window: { x: 240, y: 48, w: 1440, h: 810 },
	/** The THEN / NOW rail: aligned to the window's edges. */
	rail: { y: 872, h: 104 },
	/** The caption row's top. */
	captionY: 994,
	/** One tick per month, May to November. */
	months: 7,
} as const;

export type RigState = "then" | "now";

export interface RigOptions {
	/** [Then caption, Now caption]. */
	captions: [string, string];
	/** Where the marker starts (a pair entered from the previous pair's Now starts at "now"). */
	state?: RigState;
	/** The rig is not on screen yet: it builds in with enter() (the first pair, after the title). */
	entering?: boolean;
}

export interface Rig {
	root: HTMLElement;
	window: HTMLElement;
	/** The footage layers (fill the window). */
	thenLayer: HTMLElement;
	nowLayer: HTMLElement;
	/** Builds the rig in (window, rail, caption). Returns its end (ms). */
	enter(): number;
	/** Moves the marker back from NOW to THEN (the next pair's start). Returns its end (ms). */
	rewind(duration?: number): number;
	/** The Then → Now sweep. Returns its end (ms from now). */
	sweep(duration?: number): number;
}

export function createRig(host: HTMLElement, opts: RigOptions): Rig {
	const { window: w } = RIG;
	const railBox = RIG.rail;
	const root = document.createElement("div");
	root.className = "fm-rig";
	const ticks = Array.from(
		{ length: RIG.months },
		(_, i) =>
			`<div class="fm-tick" style="left:${((i / (RIG.months - 1)) * 100).toFixed(4)}%"></div>`,
	).join("");
	root.innerHTML = `
		<div class="fm-window" data-ref="window" style="left:${w.x}px; top:${w.y}px; width:${w.w}px; height:${w.h}px">
			<div class="fm-layer" data-ref="then"></div>
			<div class="fm-layer" data-ref="now" style="visibility:hidden"></div>
			<div class="fm-border"></div>
			<div class="fm-border" data-ref="border-now"></div>
		</div>
		<div class="fm-rail" style="left:${w.x}px; top:${railBox.y}px; width:${w.w}px; height:${railBox.h}px">
			<span class="fm-label" data-ref="label-then">THEN</span>
			<div class="fm-ruler" data-ref="ruler">
				<div class="fm-ruler-line"></div>
				<div class="fm-ruler-fill" data-ref="fill"></div>
				${ticks}
				<div class="fm-marker" data-ref="marker"></div>
			</div>
			<span class="fm-label" data-ref="label-now">NOW</span>
		</div>
		<div class="fm-caption" style="left:${w.x}px; top:${RIG.captionY}px; width:${w.w}px; height:64px">
			<span data-ref="caption-then"></span>
			<span data-ref="caption-now"></span>
		</div>`;
	host.appendChild(root);
	const q = (name: string) => root.querySelector(`[data-ref="${name}"]`) as HTMLElement;
	const win = q("window");
	const then = q("then");
	const now = q("now");
	const ruler = q("ruler");
	const fill = q("fill");
	const marker = q("marker");
	const labelThen = q("label-then");
	const labelNow = q("label-now");
	const borderNow = q("border-now");
	const captionThen = q("caption-then");
	const captionNow = q("caption-now");
	[captionThen.textContent, captionNow.textContent] = opts.captions;
	// One line, always: a caption wider than the row steps down in size (fonts are loaded first).
	const row = captionThen.parentElement as HTMLElement;
	for (
		let size = 60;
		size > 40 && Math.max(captionThen.scrollWidth, captionNow.scrollWidth) > w.w;
		size -= 2
	) {
		row.style.fontSize = `${size - 2}px`;
	}
	const line = root.querySelector(".fm-ruler-line") as HTMLElement;
	const tickEls = Array.from(root.querySelectorAll(".fm-tick")) as HTMLElement[];
	if (opts.entering) {
		win.style.opacity = "0";
		for (const el of [labelThen, labelNow, marker, row, ...tickEls]) el.style.opacity = "0";
		line.style.transform = "scaleX(0)";
	}

	const easing = () => css("--ease-sweep");
	const markerAt = (p: number) => `translateX(${(p * ruler.offsetWidth).toFixed(2)}px)`;
	const markerColor = (s: RigState) => (s === "now" ? css("--amber") : css("--color-fg"));
	const markerGlow = (s: RigState) =>
		s === "now"
			? "0 0 0 6px rgba(255, 181, 71, 0.22), 0 0 26px rgba(255, 181, 71, 0.6)"
			: "0 0 0 6px rgba(230, 245, 250, 0.14)";

	const setLit = (s: RigState) => {
		labelThen.toggleAttribute("data-lit", s === "then");
		labelNow.toggleAttribute("data-lit", s === "now");
	};

	// The resting state, set before the first frame (no animation).
	const start = opts.state ?? "then";
	setLit(start);
	marker.style.transform = markerAt(start === "now" ? 1 : 0);
	marker.style.background = markerColor(start);
	marker.style.boxShadow = markerGlow(start);
	fill.style.transform = `scaleX(${start === "now" ? 1 : 0})`;

	/** Marker, fill and labels travel from one end to the other. */
	const travel = (from: RigState, to: RigState, duration: number) => {
		const timing = { duration, easing: easing(), fill: "forwards" as const };
		const p = (s: RigState) => (s === "now" ? 1 : 0);
		marker.animate(
			[
				{
					transform: markerAt(p(from)),
					background: markerColor(from),
					boxShadow: markerGlow(from),
				},
				{ transform: markerAt(p(to)), background: markerColor(to), boxShadow: markerGlow(to) },
			],
			timing,
		);
		fill.animate([{ transform: `scaleX(${p(from)})` }, { transform: `scaleX(${p(to)})` }], timing);
		// The labels hand over at the midpoint, with a short cross-fade.
		const fadeOut = (el: HTMLElement) =>
			el.animate([{ opacity: 1 }, { opacity: 0.26 }], {
				duration: duration / 2,
				delay: duration / 4,
				easing: "linear",
				fill: "forwards",
			});
		const fadeIn = (el: HTMLElement) =>
			el.animate([{ opacity: 0.26 }, { opacity: 1 }], {
				duration: duration / 2,
				delay: duration / 4,
				easing: "linear",
				fill: "forwards",
			});
		fadeOut(from === "then" ? labelThen : labelNow);
		fadeIn(to === "then" ? labelThen : labelNow);
		setTimeout(() => setLit(to), duration);
	};

	return {
		root,
		window: win,
		thenLayer: then,
		nowLayer: now,
		enter() {
			const settle = css("--ease-settle");
			const both = "both" as const;
			win.animate(
				[
					{ opacity: 0, transform: "scale(0.97)" },
					{ opacity: 1, transform: "none" },
				],
				{ duration: 520, easing: settle, fill: both },
			);
			line.style.transformOrigin = "0 50%";
			line.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
				duration: 560,
				delay: 80,
				easing: css("--ease-draw"),
				fill: both,
			});
			tickEls.forEach((t, i) =>
				t.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 160,
					delay: 120 + i * 60,
					fill: both,
				}),
			);
			const rise = (el: HTMLElement, delay: number, to = 1) =>
				el.animate(
					[
						{ opacity: 0, transform: "translateY(24px)" },
						{ opacity: to, transform: "none" },
					],
					{ duration: 480, delay, easing: settle, fill: both },
				);
			rise(labelThen, 60);
			rise(labelNow, 140, 0.26);
			marker.animate(
				[
					{ opacity: 0, transform: `${markerAt(0)} scale(0.4)` },
					{ opacity: 1, transform: `${markerAt(0)} scale(1)` },
				],
				{ duration: 360, delay: 200, easing: settle, fill: both },
			);
			rise(row, 260);
			return 740;
		},
		rewind(duration = 300) {
			travel("now", "then", duration);
			return duration;
		},
		sweep(duration = ms("--dur-sweep") || 640) {
			const end = sweepReveal(win, now, then, { x: 0, y: 0, w: w.w, h: w.h }, { duration });
			const timing = { duration, easing: easing(), fill: "forwards" as const };
			borderNow.animate(
				[{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
				timing,
			);
			travel("then", "now", duration);
			// The caption swaps as the beam passes the middle: the old line leaves, then the new one
			// arrives, so the two never overlap.
			captionThen.animate(
				[
					{ opacity: 1, transform: "translateY(0)" },
					{ opacity: 0, transform: "translateY(-14px)" },
				],
				{
					duration: duration * 0.22,
					delay: duration * 0.3,
					easing: css("--ease-exit"),
					fill: "forwards",
				},
			);
			captionNow.animate(
				[
					{ opacity: 0, transform: "translateY(14px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{
					duration: duration * 0.4,
					delay: duration * 0.52,
					easing: css("--ease-settle"),
					fill: "both",
				},
			);
			return end;
		},
	};
}
