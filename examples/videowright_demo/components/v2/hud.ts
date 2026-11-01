import "./v2.css";
import {
	type Tick,
	type Ticker,
	createTicker,
	css,
	draw,
	expoOut,
	ms,
	svg,
	tidy,
} from "./motion.js";
import type { Box } from "./stage.js";

// ── HUD vocabulary ──────────────────────────────────────────────────────────────────────
// Lifted from the Motion Engineering samples' kit. Amber is the signal (one subject at a
// time), cyan is measurement.

// Mono "decode": characters resolve left to right through seeded noise. No Math.random.
const NOISE = "#%&*+=<>/0123456789ABCDEFHKMNPRTUVXYZ";
// Which decode owns each element's text. Every decode gets a per-element number when it is
// created, and claims the element when it starts, but only over decodes created before it: the
// decode scheduled last wins, even if an older one starts later (so a stale readout can't
// overwrite a current one), and a scheduled decode never blanks the element before its time.
const created = new WeakMap<Element, number>();
const claimedBy = new WeakMap<Element, number>();

export interface DecodeOptions {
	/** ms between characters (default 26). */
	perChar?: number;
	/** Stops the decode once aborted, e.g. the segment that scheduled it unmounted. */
	signal?: AbortSignal;
}

export function decode(
	ticker: Ticker,
	el: Element,
	text: string,
	start: number,
	opts: DecodeOptions = {},
): void {
	const perChar = opts.perChar ?? 26;
	const settle = 170;
	const id = (created.get(el) ?? 0) + 1;
	created.set(el, id);
	let claimed = false;
	const tick: Tick = (t) => {
		if (opts.signal?.aborted) return false;
		const local = tidy(t - start);
		// Not started yet: leave the element, and whatever is decoding into it, alone.
		if (local < 0) return true;
		if (!claimed) {
			// A decode created after this one already owns the element: this one is stale.
			if ((claimedBy.get(el) ?? 0) > id) return false;
			claimedBy.set(el, id);
			claimed = true;
		} else if (claimedBy.get(el) !== id) {
			return false;
		}
		let out = "";
		for (let i = 0; i < text.length && local >= i * perChar; i++) {
			const ch = text[i];
			const resolved = local >= i * perChar + settle || ch === " ";
			out += resolved ? ch : NOISE[(i * 7 + Math.floor(local / 45) * 11) % NOISE.length];
		}
		el.textContent = out;
		return local < (text.length - 1) * perChar + settle;
	};
	ticker.add(tick);
}

// Numbers tick: discrete steps on the --dur-tick grid, decelerating into the value.
export function tickTo(
	ticker: Ticker,
	el: Element,
	to: number,
	start: number,
	duration: number,
	format: (v: number) => string,
	from = 0,
): void {
	const step = ms("--dur-tick") || 50;
	ticker.add((t) => {
		const p = Math.min((Math.floor(tidy(Math.max(0, t - start)) / step) * step) / duration, 1);
		el.textContent = format(from + (to - from) * expoOut(p));
		return p < 1;
	});
}

const BLINK_IN = [
	{ opacity: 0, easing: "linear" },
	{ opacity: 1, offset: 0.28, easing: "steps(1, end)" },
	{ opacity: 0.22, offset: 0.62, easing: "steps(1, end)" },
	{ opacity: 1, offset: 0.7, easing: "steps(1, end)" },
	{ opacity: 0.22, offset: 0.8, easing: "steps(1, end)" },
	{ opacity: 1, offset: 0.88 },
	{ opacity: 1 },
];

// Crosshair lock: the reticle drops in oversized and rotated, settles on target, blinks twice.
// Each shape is drawn twice, a canvas-colored knockout under the amber stroke.
export function lockOn(parent: Element, cx: number, cy: number, delay: number, r = 34) {
	const g = svg(parent, "g", { fill: "none", style: "filter: var(--glow-amber-filter)" });
	const o = r + 22;
	const ticks = `M${cx - o} ${cy}h18M${cx + o - 18} ${cy}h18M${cx} ${cy - o}v18M${cx} ${cy + o - 18}v18`;
	for (const [stroke, width] of [
		["var(--color-bg)", 7],
		["var(--amber)", 3],
	] as const) {
		svg(g, "circle", { cx, cy, r, stroke, "stroke-width": width });
		svg(g, "path", { d: ticks, stroke, "stroke-width": width });
	}
	svg(g, "circle", { cx, cy, r: 4, fill: "var(--amber)" });
	g.style.transformOrigin = `${cx}px ${cy}px`;
	g.animate([{ transform: "scale(2.4) rotate(45deg)" }, { transform: "none" }], {
		duration: 620,
		delay,
		easing: css("--ease-settle"),
		fill: "both",
	});
	g.animate(BLINK_IN, { duration: 900, delay, fill: "both" });
	return g;
}

// Registration corners: four amber L-brackets close in on a box from outside, settle, and
// blink twice, like autofocus locking on.
export function registerOn(parent: Element, box: Box, delay: number, pad = 14, arm = 34) {
	const { x, y, w, h } = box;
	return [
		[x - pad, y - pad, 1, 1],
		[x + w + pad, y - pad, -1, 1],
		[x - pad, y + h + pad, 1, -1],
		[x + w + pad, y + h + pad, -1, -1],
	].map(([px, py, dx, dy]) => {
		const c = svg(parent, "path", {
			d: `M${px} ${py + dy * arm}V${py}H${px + dx * arm}`,
			stroke: "var(--amber)",
			"stroke-width": 3,
			fill: "none",
		});
		c.animate([{ transform: `translate(${-dx * 72}px, ${-dy * 56}px)` }, { transform: "none" }], {
			duration: 640,
			delay,
			easing: css("--ease-settle"),
			fill: "both",
		});
		c.animate(BLINK_IN, { duration: 900, delay, fill: "both" });
		return c;
	});
}

export interface Dimension {
	strokes: SVGGeometryElement[];
	marks: Element[];
}

/**
 * A dimension line under a subject spanning x0..x1: witness lines drop from `from` first, the
 * dimension draws from its centre outward, then a chip ticks to the measured width.
 */
export function dimension(
	parent: Element,
	ticker: Ticker,
	span: { x0: number; x1: number; y: number; from: number },
	at: number,
	labels = true,
): Dimension {
	const { x0, x1, y, from } = span;
	const cx = (x0 + x1) / 2;
	const g = svg(parent, "g", { stroke: "var(--cyan)", "stroke-width": 2, fill: "none" });
	const witness = [x0, x1].map((x) => svg(g, "path", { d: `M${x} ${from} V${y + 14}` }));
	const arms = [x0, x1].map((x) => svg(g, "path", { d: `M${cx} ${y} H${x}` }));
	for (const w of witness) draw(w, at, 420);
	for (const a of arms) draw(a, at + 300, 640);
	const strokes = [...arms, ...witness];
	if (!labels) return { strokes, marks: [] };
	const chip = svg(parent, "rect", {
		x: cx - 110,
		y: y - 22,
		width: 220,
		height: 44,
		fill: "var(--color-bg)",
	});
	const value = svg(parent, "text", {
		x: cx,
		y: y + 10,
		"text-anchor": "middle",
		fill: "var(--cyan)",
		class: "me-readout",
		style: "font-size: var(--type-mono)",
	});
	for (const node of [chip, value]) {
		node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: at + 500, fill: "both" });
	}
	tickTo(
		ticker,
		value,
		x1 - x0,
		ticker.now() + at + 500,
		700,
		(v) => `${Math.round(v).toLocaleString("en-US")} PX`,
	);
	return { strokes, marks: [chip, value] };
}

/**
 * Release: the HUD lets go before the cut. Strokes retract toward their origin, marks fade;
 * the content stays for the transition to carry out. Returns how long it takes (ms).
 */
export function release(strokes: SVGGeometryElement[], marks: Element[]): number {
	const out = ms("--dur-exit");
	for (const p of strokes) draw(p, 0, out * 0.8, true);
	for (const m of marks) {
		m.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: out * 0.6,
			easing: css("--ease-exit"),
			fill: "forwards",
		});
	}
	return out;
}

// ── Persistent HUD chrome ───────────────────────────────────────────────────────────────
// One overlay shared by every v2 segment, so the chrome is the same object across cuts and
// wipes: the corner frame and slots never re-enter, only readouts whose value changed update
// (a short decode), and the timecode runs on from the moment the HUD came online. It lives in
// the player's .vw-host, above both slots and any transition layer (which use z-index ≤ 3)
// and below the dev player's own HUD. It deliberately outlives segments: unmount() never
// removes it; a segment without HUD chrome calls hideHud().

export interface HudState {
	/** 1-based beat index. */
	beat: number;
	total: number;
	section: string;
	/** Initial bl readout for the scene (decodes in). */
	probe?: string;
	/** Delay (ms) before changed readouts update, e.g. to land with a push's arrival. */
	delay?: number;
	/**
	 * Bring the HUD online fresh even if it is already up: the timecode restarts at zero and
	 * the readouts are set at once. For the segment where the instrument's clock starts (the
	 * title card, after the hard cut), so a dev restart or Prev matches the render.
	 */
	restart?: boolean;
	/** The segment's ctx.signal: readout updates it scheduled stop if it unmounts first. */
	signal: AbortSignal;
}

interface Chrome {
	el: HTMLElement;
	index: HTMLElement;
	section: HTMLElement;
	clock: HTMLElement;
	probe: HTMLElement;
	online: AbortController | null;
	ticker: Ticker | null;
}

let chrome: Chrome | null = null;

const pad2 = (n: number) => String(n).padStart(2, "0");

function chromeFor(anchor: HTMLElement): Chrome {
	const host = (anchor.closest(".vw-host") as HTMLElement | null) ?? anchor;
	if (chrome?.el.isConnected && chrome.el.parentElement === host) return chrome;
	chrome?.online?.abort();
	chrome?.el.remove();
	const el = document.createElement("div");
	el.className = "me-hud v2-hud";
	el.style.cssText = "z-index: 20; display: none";
	el.innerHTML = `
		<div class="me-frame"></div>
		<div class="me-hud-slot" data-at="tl">
			<span class="me-label" data-ref="index"></span>
			<span class="me-label" data-ref="section" style="color: var(--fg-2)"></span>
		</div>
		<div class="me-hud-slot" data-at="tr"><span class="me-readout" data-ref="clock"></span></div>
		<div class="me-hud-slot" data-at="bl">
			<span class="me-readout" data-ref="probe" style="color: var(--color-muted)"></span>
		</div>
		<div class="me-hud-slot" data-at="br">
			<span class="me-readout" style="color: var(--color-muted)">GRID 40 PX</span>
		</div>`;
	host.appendChild(el);
	const q = (name: string) => el.querySelector(`[data-ref="${name}"]`) as HTMLElement;
	chrome = {
		el,
		index: q("index"),
		section: q("section"),
		clock: q("clock"),
		probe: q("probe"),
		online: null,
		ticker: null,
	};
	return chrome;
}

const timecode = (t: number) => {
	const cs = Math.floor(t / 10);
	const mm = pad2(Math.floor(cs / 6000));
	const ss = ((cs % 6000) / 100).toFixed(2).padStart(5, "0");
	return `T+${mm}:${ss}`;
};

/**
 * Shows the HUD for a segment. Called from mount(), so it is on screen from the segment's first
 * frame (a hard cut lands on it whole). If the HUD was hidden (or `restart` is set) it comes
 * online at once, no entrance, with its timecode at zero; if it was already up, only changed
 * readouts decode, after `delay`.
 */
export function showHud(anchor: HTMLElement, state: HudState): void {
	const c = chromeFor(anchor);
	const index = `${pad2(state.beat)} / ${pad2(state.total)}`;
	const section = state.section.toUpperCase();
	if (!c.online || !c.ticker || state.restart) {
		c.online?.abort();
		c.online = new AbortController();
		const epoch = performance.now();
		const ticker = createTicker(() => performance.now() - epoch, c.online.signal);
		c.ticker = ticker;
		const clock = c.clock;
		ticker.add((t) => {
			clock.textContent = timecode(t);
			return true;
		});
		for (const el of [c.index, c.section, c.probe]) claimedBy.delete(el);
		c.index.textContent = index;
		c.section.textContent = section;
		c.probe.textContent = state.probe ?? "";
		c.el.style.display = "";
		return;
	}
	const at = c.ticker.now() + (state.delay ?? 0);
	const opts = { signal: state.signal };
	if (c.index.textContent !== index) decode(c.ticker, c.index, index, at, opts);
	if (c.section.textContent !== section) decode(c.ticker, c.section, section, at + 60, opts);
	if (state.probe !== undefined) decode(c.ticker, c.probe, state.probe, at + 120, opts);
}

/**
 * Decodes a new bl readout `delay` ms from now: what the HUD is doing, or a fact the frame
 * doesn't show. `signal` is the segment's ctx.signal, so a pending update dies with its
 * segment.
 */
export function hudProbe(text: string, delay: number, signal: AbortSignal): void {
	if (!chrome?.ticker || signal.aborted) return;
	decode(chrome.ticker, chrome.probe, text, chrome.ticker.now() + delay, { signal });
}

/** Takes the HUD offline (for segments that are a real screen, not the instrument). */
export function hideHud(anchor: HTMLElement): void {
	const c = chromeFor(anchor);
	c.online?.abort();
	c.online = null;
	c.ticker = null;
	c.el.style.display = "none";
}
