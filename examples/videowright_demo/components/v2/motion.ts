// demo_v2 motion kit: token readers, easing, stroke draws, masked reveals, the clock-driven
// ticker and the camera. Lifted from the Motion Engineering samples' inlined kit. Everything
// time-based reads one clock (ctx.clock()) or runs on WAAPI, so renders are deterministic.
// No imports, so the pure parts are unit-testable outside a browser.

export type Tick = (t: number) => boolean;
export type Attrs = Record<string, string | number>;

export const SVG_NS = "http://www.w3.org/2000/svg";
/** Design canvas, in stage px. */
export const FRAME = { w: 1920, h: 1080 } as const;

export const css = (name: string) =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim();
export const ms = (name: string) => Number.parseFloat(css(name)) || 0;
export const clamp01 = (p: number) => Math.min(Math.max(p, 0), 1);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// Clock arithmetic carries float noise (a frame due at 2300ms can read 2299.9999999). Round
// before quantizing, so stepped values land on the same frame in every render.
export const tidy = (t: number) => Math.round(t * 1000) / 1000;
export const expoOut = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * clamp01(p)));
export const sineInOut = (p: number) => (1 - Math.cos(Math.PI * clamp01(p))) / 2;
/** JS twin of --ease-draw (cubic in-out), for geometry driven from a rAF loop. */
export const drawEase = (p: number) => {
	const q = clamp01(p);
	return q < 0.5 ? 4 * q ** 3 : 1 - (-2 * q + 2) ** 3 / 2;
};
export function svg<K extends keyof SVGElementTagNameMap>(
	parent: Element,
	tag: K,
	attrs: Attrs,
): SVGElementTagNameMap[K] {
	const node = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
	parent.appendChild(node);
	return node;
}

/**
 * Eased stroke draw; `reverse` retracts it toward its start. The gap is twice the path length,
 * so a fully hidden round-capped stroke leaves no zero-length dash (a dot) at either end.
 */
export function draw(
	path: SVGGeometryElement,
	delay: number,
	duration: number,
	reverse = false,
	easing = reverse ? css("--ease-exit") : css("--ease-draw"),
): Animation {
	path.setAttribute("pathLength", "1");
	path.style.strokeDasharray = "1 2";
	const frames = reverse
		? [{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }]
		: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }];
	return path.animate(frames, { duration, delay, easing, fill: "both" });
}

/**
 * Masked line reveal: each element rises out of its .me-line mask, from `from` (below the
 * mask: 112% clears the mask's usual 0.12em of descender room; a mask with more room needs more).
 */
export function riseIn(
	els: Element[],
	delay: number,
	duration = ms("--dur-slow"),
	stagger = ms("--stagger"),
	from = "translateY(112%)",
): void {
	els.forEach((node, i) => {
		(node as HTMLElement).animate([{ transform: from }, { transform: "none" }], {
			duration,
			delay: delay + i * stagger,
			easing: css("--ease-settle"),
			fill: "both",
		});
	});
}

/**
 * The masked line exit: each element rises out of the top of its mask (riseIn reversed), far
 * enough (130%) that a display face's descenders, which hang below its 0.94 line box, clear
 * the mask too.
 */
export function riseOut(
	els: Element[],
	delay: number,
	duration = ms("--dur-exit"),
	stagger = ms("--stagger-tight"),
	easing = css("--ease-exit"),
): void {
	els.forEach((node, i) => {
		(node as HTMLElement).animate([{ transform: "none" }, { transform: "translateY(-130%)" }], {
			duration,
			delay: delay + i * stagger,
			easing,
			fill: "forwards",
		});
	});
}

export interface Ticker {
	/** The clock, rounded (see tidy). Use it for every start time. */
	now(): number;
	/** Runs `tick(t)` every frame until it returns false. */
	add(tick: Tick): void;
}

/**
 * One rAF loop running tickers on `clock`. Oldest first, so when two tickers write the same
 * element the newest one wins. Stops when `signal` aborts.
 */
export function createTicker(clock: () => number, signal: AbortSignal): Ticker {
	let ticks: Tick[] = [];
	const now = () => tidy(clock());
	const frame = () => {
		if (signal.aborted) return;
		const t = now();
		// Ticks added while this frame runs land on the fresh list and are kept.
		const current = ticks;
		ticks = [];
		const keep = current.filter((tick) => tick(t));
		ticks = keep.concat(ticks);
		requestAnimationFrame(frame);
	};
	requestAnimationFrame(frame);
	return {
		now,
		add: (tick) => {
			if (tick(now())) ticks.push(tick);
		},
	};
}

// ── Camera ──────────────────────────────────────────────────────────────────────────────
// A camera is a focus point (stage px) and a zoom. At the frame centre and zoom 1 it is the
// identity, so a scene that starts and ends there hands over to the next one without a jump.

export interface Camera {
	x: number;
	y: number;
	z: number;
}

/** A camera key: at time `t` (ms) the camera is at (x, y, z), arrived at with `ease`. */
export interface CameraKey extends Camera {
	t: number;
	ease?: (p: number) => number;
}

export const IDENTITY: Camera = { x: FRAME.w / 2, y: FRAME.h / 2, z: 1 };

/**
 * The camera at time `t` along `keys` (sorted by t). Before the first key it holds the first,
 * after the last it holds the last; between two keys it moves with the later key's ease. Zoom
 * interpolates in log space, so a pull-back reads as a constant-rate dolly.
 */
export function cameraAt(keys: readonly CameraKey[], t: number): Camera {
	if (keys.length === 0) return IDENTITY;
	const first = keys[0];
	if (t <= first.t) return { x: first.x, y: first.y, z: first.z };
	for (let i = 1; i < keys.length; i++) {
		const b = keys[i];
		if (t < b.t) {
			const a = keys[i - 1];
			const p = (b.ease ?? sineInOut)((t - a.t) / (b.t - a.t));
			return {
				x: lerp(a.x, b.x, p),
				y: lerp(a.y, b.y, p),
				z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), p)),
			};
		}
	}
	const last = keys[keys.length - 1];
	return { x: last.x, y: last.y, z: last.z };
}

/** The transform (origin 0 0) that puts the camera's focus point at the frame centre. */
export function cameraTransform(cam: Camera): string {
	const tx = FRAME.w / 2 - cam.z * cam.x;
	const ty = FRAME.h / 2 - cam.z * cam.y;
	return `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${cam.z.toFixed(5)})`;
}
