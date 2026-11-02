import "./v2.css";
import { type Tick, type Ticker, createTicker, css, draw, expoOut, ms, tidy } from "./motion.js";

// ── HUD vocabulary ──────────────────────────────────────────────────────────────────────
// Lifted from the Motion Engineering samples' kit: decoding readouts, ticking numbers and the
// release. demo_v2 keeps the HUD quiet: no lock-on reticles or registration corners.

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
	/**
	 * Drops the decode if aborted before it starts writing (e.g. the segment that scheduled it
	 * unmounted first). A decode that has started always finishes, so the element never stays
	 * on half-scrambled characters.
	 */
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
		if (opts.signal?.aborted && !claimed) return false;
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
// wipes: the four corner brackets and the top readouts (the beat index and section, top left;
// the timecode, top right) never re-enter, only readouts whose value changed update (a short
// decode), and the timecode runs on from the moment the HUD came online. The bottom corners
// carry no readouts: the brackets alone frame the picture. It lives in
// the player's .vw-host, above both slots and any transition layer (which use z-index ≤ 3)
// and below the dev player's own HUD. It deliberately outlives segments: unmount() never
// removes it; a segment without HUD chrome calls hideHud().

export interface HudState {
	/** 1-based beat index. */
	beat: number;
	total: number;
	section: string;
	/** Delay (ms) before changed readouts update, e.g. to land with a push's arrival. */
	delay?: number;
	/**
	 * Bring the HUD online fresh even if it is already up: the timecode restarts at zero and
	 * the readouts are set at once. For the segment where the instrument's clock starts (the
	 * title card, after the hard cut), so a dev restart or Prev matches the render.
	 */
	restart?: boolean;
	/**
	 * The segment's ctx.signal: readout updates it scheduled are dropped if it unmounts before
	 * they start; one already decoding runs to its full text.
	 */
	signal: AbortSignal;
}

interface Chrome {
	el: HTMLElement;
	index: HTMLElement;
	section: HTMLElement;
	clock: HTMLElement;
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
		<div class="me-hud-slot" data-at="tr"><span class="me-readout" data-ref="clock"></span></div>`;
	host.appendChild(el);
	const q = (name: string) => el.querySelector(`[data-ref="${name}"]`) as HTMLElement;
	chrome = {
		el,
		index: q("index"),
		section: q("section"),
		clock: q("clock"),
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
		for (const el of [c.index, c.section]) claimedBy.delete(el);
		c.index.textContent = index;
		c.section.textContent = section;
		c.el.style.display = "";
		return;
	}
	const at = c.ticker.now() + (state.delay ?? 0);
	const opts = { signal: state.signal };
	if (c.index.textContent !== index) decode(c.ticker, c.index, index, at, opts);
	if (c.section.textContent !== section) decode(c.ticker, c.section, section, at + 60, opts);
}

/** Takes the HUD offline (for segments that are a real screen, not the instrument). */
export function hideHud(anchor: HTMLElement): void {
	const c = chromeFor(anchor);
	c.online?.abort();
	c.online = null;
	c.ticker = null;
	c.el.style.display = "none";
}
