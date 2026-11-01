import type { PlayerContext } from "videowright";
import "./v2.css";
import { type Ticker, createTicker, css, draw, expoOut, ms, sineInOut, svg } from "./motion.js";

// The Motion Engineering stage for demo_v2: grid → key light → vignette → world (content and
// annotation SVG) → grain. Every v2 stage has the same grid at camera identity, so a cut or a
// wipe reads as one instrument changing readouts. The HUD chrome is not part of the stage: it
// is the persistent overlay in hud.ts, shared by every segment.

const GRID_OVERSCAN = 160;

export interface StageOptions {
	/** Focal point for the key light, in stage px. */
	key?: { x: number; y: number };
	/** Offset into the 7s grid scan (ms), so consecutive scenes don't scan in step. */
	scanPhase?: number;
}

export interface Stage {
	root: HTMLElement;
	grid: HTMLElement;
	world: HTMLElement;
	content: HTMLElement;
	svg: SVGSVGElement;
	scan: HTMLElement;
	flare: HTMLElement;
	scanPhase: number;
	ref(name: string): HTMLElement;
	/** Camera pivot in stage px (default: frame centre). */
	setOrigin(x: number, y: number): void;
}

export function createStage(el: HTMLElement, opts: StageOptions = {}): Stage {
	const key = opts.key ?? { x: 960, y: 500 };
	el.innerHTML = `
		<div class="me-stage" style="--key-x: ${key.x}px; --key-y: ${key.y}px">
			<div class="me-grid"><div class="me-scan"></div><div class="me-flare"></div></div>
			<div class="me-key"></div>
			<div class="me-light"></div>
			<div class="me-world">
				<div class="me-content"></div>
				<svg class="me-svg" viewBox="0 0 1920 1080"></svg>
			</div>
			<div class="me-grain"></div>
		</div>`;
	const q = (s: string) => el.querySelector(s) as HTMLElement;
	const grid = q(".me-grid");
	const world = q(".me-world");
	return {
		root: q(".me-stage"),
		grid,
		world,
		content: q(".me-content"),
		svg: el.querySelector(".me-svg") as SVGSVGElement,
		scan: q(".me-scan"),
		flare: q(".me-flare"),
		scanPhase: opts.scanPhase ?? 0,
		ref: (name) => q(`[data-ref="${name}"]`),
		setOrigin: (x, y) => {
			world.style.transformOrigin = `${x}px ${y}px`;
			grid.style.transformOrigin = `${x + GRID_OVERSCAN}px ${y + GRID_OVERSCAN}px`;
		},
	};
}

export interface Ambient extends Ticker {
	nudge(by: number, duration: number): void;
	/** Eases the camera back to identity over `duration` ms (the exit's release). */
	rest(duration: number): void;
}

/**
 * The breathe layer: a slow camera push (the grid follows at 60% for parallax), the grid scan,
 * and any tickers (decodes, counting numbers).
 */
export function startAmbient(
	ctx: PlayerContext,
	stage: Stage,
	opts: { driftMs?: number } = {},
): Ambient {
	const ticker = createTicker(() => ctx.clock(), ctx.signal);
	const nudges: Array<{ at: number; by: number; duration: number }> = [];
	let restAt = Number.POSITIVE_INFINITY;
	let restFor = 1;
	// One push over --dur-ambient by default; a scene that holds still for seconds (the title
	// card's hero hold) passes a shorter drift so the push reads.
	const driftMs = opts.driftMs ?? (ms("--dur-ambient") || 16000);
	stage.scan.animate([{ maskPosition: "0 -320px" }, { maskPosition: "0 1720px" }], {
		duration: 7000,
		delay: -stage.scanPhase,
		iterations: Number.POSITIVE_INFINITY,
	});
	const camera = (t: number) => {
		const settle = 1 - sineInOut((t - restAt) / restFor);
		const pan = sineInOut(t / driftMs) * settle;
		let zoom = 0.024 * sineInOut(t / driftMs);
		for (const n of nudges) zoom += n.by * expoOut((t - n.at) / n.duration);
		zoom *= settle;
		const f = (v: number, d = 2) => v.toFixed(d);
		stage.world.style.transform = `translate(${f(-10 * pan)}px, ${f(-4 * pan)}px) scale(${f(1 + zoom, 5)})`;
		stage.grid.style.transform = `translate(${f(-6 * pan)}px, ${f(-2.4 * pan)}px) scale(${f(1 + 0.6 * zoom, 5)})`;
		return true;
	};
	ticker.add(camera);
	return {
		...ticker,
		nudge: (by, duration) => nudges.push({ at: ticker.now(), by, duration }),
		rest: (duration) => {
			restAt = ticker.now();
			restFor = duration;
		},
	};
}

export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * An element's layout box in stage px, from the offset chain up to `.me-content` (or `stop`).
 * Offsets ignore the camera and the dev player's scaling.
 */
export function boxOf(el: HTMLElement, stop = "me-content"): Box {
	let x = 0;
	let y = 0;
	let node: HTMLElement | null = el;
	while (node && !node.classList.contains(stop)) {
		x += node.offsetLeft;
		y += node.offsetTop;
		const parent = node.offsetParent as HTMLElement | null;
		if (parent && !parent.classList.contains(stop)) {
			x += parent.clientLeft;
			y += parent.clientTop;
		}
		node = parent;
	}
	return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/**
 * The grid answers a lock: registration crosses within ~320px of (x, y) brighten, then decay.
 * `attack` is where the peak sits (fraction of `duration`); 0 makes a flash that is at full
 * brightness on its first frame, for a hard cut. The position switches when the flare starts
 * (not when it is scheduled), so flares can be queued without moving one that is still fading.
 */
export function flare(
	stage: Stage,
	x: number,
	y: number,
	delay: number,
	attack = 0.15,
	duration = 700,
): void {
	const at = { "--flare-x": `${x + GRID_OVERSCAN}px`, "--flare-y": `${y + GRID_OVERSCAN}px` };
	stage.flare.animate([at, at], { duration, delay, fill: "forwards" });
	const frames =
		attack === 0
			? [{ opacity: 1, easing: css("--ease-settle") }, { opacity: 0 }]
			: [{ opacity: 0 }, { opacity: 1, offset: attack }, { opacity: 0 }];
	stage.flare.animate(frames, { duration, delay, fill: "forwards" });
}

/**
 * The style's panel entrance (the samples' panelIn): a hairline outline draws around the
 * panel, the surface fills top-down behind it, and the outline hands over to the panel's own
 * border. The outline is drawn in the stage's annotation layer, at the panel's layout box.
 */
export function panelIn(
	stage: Stage,
	panel: HTMLElement,
	delay: number,
	duration = ms("--dur-draw"),
): SVGPathElement {
	const { x, y, w, h } = boxOf(panel);
	const r = Number.parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 0;
	const [l, t, rt, b] = [x + 0.5, y + 0.5, x + w - 0.5, y + h - 0.5];
	const outline = svg(stage.svg, "path", {
		d: `M${l + r} ${t}H${rt - r}A${r} ${r} 0 0 1 ${rt} ${t + r}V${b - r}A${r} ${r} 0 0 1 ${rt - r} ${b}H${l + r}A${r} ${r} 0 0 1 ${l} ${b - r}V${t + r}A${r} ${r} 0 0 1 ${l + r} ${t}Z`,
		fill: "none",
		stroke: "var(--hairline-strong)",
		"stroke-width": 1.5,
	});
	draw(outline, delay, duration);
	panel.animate(
		[
			{ clipPath: "inset(-160px -160px 100% -160px)", opacity: 0.3 },
			{ clipPath: "inset(-160px)", opacity: 1 },
		],
		{
			duration: ms("--dur-slow"),
			delay: delay + duration * 0.35,
			easing: css("--ease-settle"),
			fill: "both",
		},
	);
	outline.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration: ms("--dur-normal"),
		delay: delay + duration,
		fill: "forwards",
	});
	return outline;
}
