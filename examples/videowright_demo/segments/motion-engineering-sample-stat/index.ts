import { type PlayerContext, defineSegment } from "videowright";
// ── Motion Engineering kit ──────────────────────────────────────────────────────────────
// Inlined so this file can be copied into any project and still import only "videowright".
// The stage DOM uses the me-* classes from tokens.css. Everything time-based reads
// ctx.clock() (one rAF loop) or runs on WAAPI, so renders are deterministic.

type Tick = (t: number) => boolean;
type Attrs = Record<string, string | number>;

const SVG_NS = "http://www.w3.org/2000/svg";
const GRID_OVERSCAN = 160;
const css = (name: string) =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const ms = (name: string) => Number.parseFloat(css(name)) || 0;
const clamp01 = (p: number) => Math.min(Math.max(p, 0), 1);
// Clock arithmetic carries float noise (a frame due at 2300ms can read 2299.9999999). Round
// before quantizing, so stepped values (timecode, ticks, decodes) land on the same frame in
// every render.
const tidy = (t: number) => Math.round(t * 1000) / 1000;
const expoOut = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * clamp01(p)));
const sineInOut = (p: number) => (1 - Math.cos(Math.PI * clamp01(p))) / 2;
// JS twin of --ease-draw, for geometry driven from the rAF loop (bars, riding readouts).
const drawEase = (p: number) => {
	const q = clamp01(p);
	return q < 0.5 ? 4 * q ** 3 : 1 - (-2 * q + 2) ** 3 / 2;
};

const FACES: Array<[font: string, text?: string]> = [
	['600 64px "Archivo"'],
	['500 64px "JetBrains Mono"'],
	['400 64px "ME Symbols"', "✓"],
];

// Waits only when a face is still loading. Awaiting document.fonts.load() always resumes on a
// later task; in a render that task can land inside a frame, so play() would start mid-frame
// and frames would differ from run to run.
function fontsReady(): Promise<unknown> | undefined {
	if (FACES.every(([font, text]) => document.fonts.check(font, text))) return undefined;
	return Promise.all(FACES.map(([font, text]) => document.fonts.load(font, text)));
}

function svg<K extends keyof SVGElementTagNameMap>(
	parent: Element,
	tag: K,
	attrs: Attrs,
): SVGElementTagNameMap[K] {
	const node = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
	parent.appendChild(node);
	return node;
}

interface StageOptions {
	index: string;
	scene: string;
	/** Focal point for the key light, in stage px. */
	key?: { x: number; y: number };
	/** Offset into the 7s grid scan, so consecutive scenes don't scan in step. */
	scanPhase?: number;
}

interface Stage {
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

function buildStage(el: HTMLElement, opts: StageOptions): Stage {
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
			<div class="me-hud">
				<div class="me-frame"></div>
				<div class="me-hud-slot" data-at="tl">
					<span class="me-label">${opts.index}</span>
					<span class="me-label" style="color: var(--fg-2)">${opts.scene}</span>
				</div>
				<div class="me-hud-slot" data-at="tr"><span class="me-readout" data-ref="clock"></span></div>
				<div class="me-hud-slot" data-at="bl">
					<span class="me-readout" data-ref="probe" style="color: var(--color-muted)"></span>
				</div>
				<div class="me-hud-slot" data-at="br">
					<span class="me-readout" style="color: var(--color-muted)">GRID 40 PX</span>
				</div>
			</div>
		</div>`;
	const q = (s: string) => el.querySelector(s) as HTMLElement;
	const grid = q(".me-grid");
	const world = q(".me-world");
	return {
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

interface Ambient {
	/** ctx.clock(), rounded (see tidy). Use it for every start time. */
	now(): number;
	add(tick: Tick): void;
	nudge(by: number, duration: number): void;
	rest(duration: number): void;
}

// The breathe layer: a slow camera push (the grid follows at 60% for parallax), the scene
// timecode, the grid scan, and any tickers (decodes, counting numbers). rest() eases the
// camera back to identity for the exit.
function startAmbient(ctx: PlayerContext, stage: Stage): Ambient {
	let ticks: Tick[] = [];
	const nudges: Array<{ at: number; by: number; duration: number }> = [];
	let restAt = Number.POSITIVE_INFINITY;
	let restFor = 1;
	const clock = stage.ref("clock");
	const driftMs = ms("--dur-ambient") || 16000;
	stage.scan.animate([{ maskPosition: "0 -320px" }, { maskPosition: "0 1720px" }], {
		duration: 7000,
		delay: -stage.scanPhase,
		iterations: Number.POSITIVE_INFINITY,
	});
	const frame = () => {
		if (ctx.signal.aborted) return;
		const t = tidy(ctx.clock());
		const settle = 1 - sineInOut((t - restAt) / restFor);
		const pan = sineInOut(t / driftMs) * settle;
		let zoom = 0.024 * sineInOut(t / driftMs);
		for (const n of nudges) zoom += n.by * expoOut((t - n.at) / n.duration);
		zoom *= settle;
		const f = (v: number, d = 2) => v.toFixed(d);
		stage.world.style.transform = `translate(${f(-10 * pan)}px, ${f(-4 * pan)}px) scale(${f(1 + zoom, 5)})`;
		stage.grid.style.transform = `translate(${f(-6 * pan)}px, ${f(-2.4 * pan)}px) scale(${f(1 + 0.6 * zoom, 5)})`;
		const cs = Math.floor(t / 10);
		const mm = String(Math.floor(cs / 6000)).padStart(2, "0");
		const ss = ((cs % 6000) / 100).toFixed(2).padStart(5, "0");
		clock.textContent = `T+${mm}:${ss}`;
		// Oldest first, so when two tickers write the same element the newest one wins.
		ticks = ticks.filter((tick) => tick(t));
		requestAnimationFrame(frame);
	};
	frame();
	const now = () => tidy(ctx.clock());
	return {
		now,
		add: (tick) => {
			if (tick(now())) ticks.push(tick);
		},
		nudge: (by, duration) => nudges.push({ at: now(), by, duration }),
		rest: (duration) => {
			restAt = now();
			restFor = duration;
		},
	};
}

// Mono "decode": characters resolve left to right through seeded noise. No Math.random.
const NOISE = "#%&*+=<>/0123456789ABCDEFHKMNPRTUVXYZ";
function decode(amb: Ambient, el: Element, text: string, start: number, perChar = 26): void {
	const settle = 170;
	el.textContent = "";
	amb.add((t) => {
		const local = tidy(t - start);
		let out = "";
		for (let i = 0; i < text.length && local >= i * perChar; i++) {
			const ch = text[i];
			const resolved = local >= i * perChar + settle || ch === " ";
			out += resolved ? ch : NOISE[(i * 7 + Math.floor(local / 45) * 11) % NOISE.length];
		}
		el.textContent = out;
		return local < (text.length - 1) * perChar + settle;
	});
}

// Numbers tick: discrete steps on the --dur-tick grid, decelerating into the value.
function tickTo(
	amb: Ambient,
	el: Element,
	to: number,
	start: number,
	duration: number,
	format: (v: number) => string,
	from = 0,
): void {
	const step = ms("--dur-tick") || 50;
	amb.add((t) => {
		const p = Math.min((Math.floor(tidy(Math.max(0, t - start)) / step) * step) / duration, 1);
		el.textContent = format(from + (to - from) * expoOut(p));
		return p < 1;
	});
}

// Eased stroke draw. reverse retracts the stroke back toward its start.
function draw(path: SVGGeometryElement, delay: number, duration: number, reverse = false) {
	path.setAttribute("pathLength", "1");
	path.style.strokeDasharray = "1 1";
	const frames = reverse
		? [{ strokeDashoffset: 0 }, { strokeDashoffset: 1 }]
		: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }];
	return path.animate(frames, {
		duration,
		delay,
		easing: reverse ? css("--ease-exit") : css("--ease-draw"),
		fill: "both",
	});
}

// Masked line reveal: each element rises out of its .me-line mask.
function riseIn(els: Element[], delay: number, duration = ms("--dur-slow")): void {
	els.forEach((node, i) => {
		(node as HTMLElement).animate([{ transform: "translateY(112%)" }, { transform: "none" }], {
			duration,
			delay: delay + i * ms("--stagger"),
			easing: css("--ease-settle"),
			fill: "both",
		});
	});
}

// A dotted leader that runs out from x0 to x1 at y, carrying a value to the right edge.
function dottedLeader(stage: Stage, x0: number, x1: number, y: number, delay: number) {
	const dots = document.createElement("div");
	dots.style.cssText = `position:absolute; left:${x0}px; top:${y - 1}px; width:${x1 - x0}px; height:2px; background:repeating-linear-gradient(to right, color-mix(in srgb, var(--cyan) 60%, transparent) 0 4px, transparent 4px 12px)`;
	stage.content.appendChild(dots);
	dots.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
		duration: ms("--dur-draw"),
		delay,
		easing: css("--ease-draw"),
		fill: "both",
	});
	return dots;
}

// The grid answers a lock: registration crosses within ~320px of (x, y) brighten, then decay.
function flare(stage: Stage, x: number, y: number, delay: number): void {
	stage.flare.style.setProperty("--flare-x", `${x + GRID_OVERSCAN}px`);
	stage.flare.style.setProperty("--flare-y", `${y + GRID_OVERSCAN}px`);
	stage.flare.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], {
		duration: 700,
		delay,
		fill: "both",
	});
}

// Crosshair lock: the reticle drops in oversized and rotated, settles on target, blinks
// twice. Each shape is drawn twice, a canvas-colored knockout under the amber stroke, so the
// reticle reads on top of amber bars.
function lockOn(parent: Element, cx: number, cy: number, delay: number, r = 34): SVGGElement {
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
	g.animate(
		[
			{ opacity: 0, easing: "linear" },
			{ opacity: 1, offset: 0.3, easing: "steps(1, end)" },
			{ opacity: 0.25, offset: 0.62, easing: "steps(1, end)" },
			{ opacity: 1, offset: 0.7, easing: "steps(1, end)" },
			{ opacity: 0.25, offset: 0.8, easing: "steps(1, end)" },
			{ opacity: 1, offset: 0.88 },
			{ opacity: 1 },
		],
		{ duration: 900, delay, fill: "both" },
	);
	return g;
}

// Release: the HUD lets go before the cut. Strokes retract, marks fade, the camera rests;
// the content stays for the transition to carry out. Returns how long to hold.
function release(amb: Ambient, strokes: SVGGeometryElement[], marks: Element[]): number {
	const out = ms("--dur-exit");
	for (const p of strokes) draw(p, 0, out * 0.8, true);
	for (const m of marks) {
		m.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: out * 0.6,
			easing: css("--ease-exit"),
			fill: "forwards",
		});
	}
	amb.rest(out * 1.4);
	return out;
}
// ── Scene ───────────────────────────────────────────────────────────────────────────────
// Stat. The grid is the chart's scale: one 40px cell is one second. The axis and the v1.9
// reference bar are on screen from frame 1 (a stat is often entered by a hard cut); the new
// build time grows as a bar with its readout riding the tip. On the cue the HUD locks onto the short bar, measures the gap,
// and the headline ratio ticks in beneath it.

const X0 = 160;
const PX_PER_S = 40;
const BEFORE = 38.6;
const AFTER = 9.2;
const BAR_H = 64;
const ROW_A = 300;
const ROW_B = 460;
const AXIS_Y = 600;

let host: HTMLElement | null = null;
let stage: Stage;

export default defineSegment({
	id: "motion-engineering-sample-stat",
	advances: [2.6, 6.0, 6.6],
	voiceover: "A cold build drops from thirty-eight seconds to nine. Four point two times faster.",

	async mount(el) {
		await fontsReady();
		host = el;
		stage = buildStage(el, {
			index: "S05 / 10",
			scene: "Stat",
			key: { x: 560, y: 640 },
			scanPhase: 1200,
		});
		const bar = (ref: string, top: number, fill: string) =>
			`<div data-ref="${ref}" style="position:absolute; left:${X0}px; top:${top}px; height:${BAR_H}px; width:0; ${fill}"></div>`;
		stage.content.innerHTML = `
			<div class="me-label" data-ref="kicker" style="position:absolute; left:160px; top:170px; color:var(--fg-2)">Benchmark · cold build</div>
			<div class="me-mono" data-ref="name-a" style="position:absolute; left:160px; top:${ROW_A - 60}px; color:var(--fg-2)"></div>
			<div class="me-mono" data-ref="name-b" style="position:absolute; left:160px; top:${ROW_B - 60}px; color:var(--fg-2)"></div>
			${bar("bar-a", ROW_A, "background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--cyan) 20%, transparent) 0 2px, color-mix(in srgb, var(--cyan) 6%, transparent) 2px 12px); box-shadow: inset -3px 0 0 var(--cyan), inset 0 0 0 2px color-mix(in srgb, var(--cyan) 50%, transparent)")}
			${bar("bar-b", ROW_B, "background: var(--amber); box-shadow: var(--glow-amber)")}
			<div class="me-mono me-measure" data-ref="tip-a" style="position:absolute; top:${ROW_A - 60}px; font-weight:560; transform:translateX(-100%)"></div>
			<div class="me-mono me-signal" data-ref="tip-b" style="position:absolute; top:${ROW_B - 60}px; font-weight:560; transform:translateX(-100%)"></div>
			<div style="position:absolute; left:${X0 - 8}px; top:690px; display:flex; align-items:last baseline; gap:64px">
				<div class="me-hero me-signal">
					<span class="me-line"><span data-ref="ratio"><span data-ref="ratio-n" class="me-num">1.0</span>×</span></span>
				</div>
				<div>
					<div class="me-body-lg" style="color:var(--color-fg)">
						<span class="me-line"><span data-ref="caption">faster cold builds</span></span>
					</div>
					<div class="me-body">
						<span class="me-line"><span data-ref="caption-2">than 1.9, on a 1.2M-line monorepo.</span></span>
					</div>
				</div>
			</div>`;
		for (const r of ["ratio", "caption", "caption-2"])
			stage.ref(r).style.transform = "translateY(112%)";
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;
		const W = 40 * PX_PER_S;

		// structure (frame 1): the axis is the grid's own 40px cells, labelled every 8 s.
		const axis = svg(s, "g", { stroke: "var(--hairline)", "stroke-width": 2, fill: "none" });
		svg(axis, "path", { d: `M${X0} ${AXIS_Y} H${X0 + W}` });
		const labels = svg(s, "g", {
			fill: "var(--color-muted)",
			class: "me-readout",
			style: "text-transform: none",
		});
		for (let sec = 0; sec <= 40; sec++) {
			const tx = X0 + sec * PX_PER_S;
			svg(axis, "path", { d: `M${tx} ${AXIS_Y} v${sec % 4 === 0 ? 16 : 7}` });
			if (sec % 8 === 0) {
				const anchor = sec === 0 ? "start" : sec === 40 ? "end" : "middle";
				const text = svg(labels, "text", { x: tx, y: AXIS_Y + 48, "text-anchor": anchor });
				text.textContent = sec === 40 ? "40 s" : String(sec);
			}
		}
		decode(amb, stage.ref("name-a"), "v1.9", amb.now());
		decode(amb, stage.ref("name-b"), "v2.0", amb.now() + 150);
		decode(amb, stage.ref("probe"), "SCALE 1 CELL = 1.0 S", amb.now() + 600);

		// fill: each bar grows on the scale with its readout riding the tip.
		const grow = (ref: string, seconds: number, start: number, duration: number) => {
			const bar = stage.ref(`bar-${ref}`);
			const tip = stage.ref(`tip-${ref}`);
			const step = ms("--dur-tick") || 50;
			amb.add((t) => {
				const p = Math.min(tidy(Math.max(0, t - start)) / duration, 1);
				const width = seconds * PX_PER_S * drawEase(p);
				bar.style.width = `${width.toFixed(2)}px`;
				// The readout rides the tip, right-aligned to it, once it clears the row's name.
				tip.style.left = `${(X0 + width).toFixed(2)}px`;
				const q = Math.min((Math.floor(tidy(Math.max(0, t - start)) / step) * step) / duration, 1);
				tip.textContent = width < 240 ? "" : `${(seconds * drawEase(q)).toFixed(1)} s`;
				return p < 1;
			});
		};
		// The v1.9 reference is already drawn on frame 1; only the news grows.
		grow("a", BEFORE, amb.now() - 1300, 1300);
		grow("b", AFTER, amb.now() + 150, 900);

		await ctx.waitForNext();
		// Beat 1 ("Four point two times"), one step at a time: lock on the short bar, drop a
		// witness from the long one, measure the gap, read it out, then the ratio, then its
		// caption.
		const now = amb.now();
		const tipB = X0 + AFTER * PX_PER_S;
		const tipA = X0 + BEFORE * PX_PER_S;
		const cy = ROW_B + BAR_H / 2;
		const lock = lockOn(s, tipB, cy, 0, 30);
		flare(stage, tipB, cy, 260);
		const dim = svg(s, "g", { stroke: "var(--cyan)", "stroke-width": 2, fill: "none" });
		const witness = svg(dim, "path", { d: `M${tipA} ${ROW_A + BAR_H} V${cy + 14}` });
		const gap = svg(dim, "path", { d: `M${tipB + 52} ${cy} H${tipA}` });
		const ends = svg(dim, "path", { d: `M${tipB + 52} ${cy - 10} v20 M${tipA} ${cy - 10} v20` });
		draw(witness, 300, 360);
		draw(gap, 500, ms("--dur-draw"));
		ends.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: 500, fill: "both" });
		const mid = (tipB + 52 + tipA) / 2;
		const chip = svg(s, "rect", {
			x: mid - 100,
			y: cy - 22,
			width: 200,
			height: 44,
			fill: "var(--color-bg)",
		});
		const saved = svg(s, "text", {
			x: mid,
			y: cy + 10,
			"text-anchor": "middle",
			fill: "var(--cyan)",
			class: "me-readout",
			style: "font-size: var(--type-mono); text-transform: none",
		});
		for (const node of [chip, saved]) {
			node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: 760, fill: "both" });
		}
		tickTo(amb, saved, BEFORE - AFTER, now + 760, 800, (v) => `−${v.toFixed(1)} s`);

		riseIn([stage.ref("ratio")], 1100, ms("--dur-slow"));
		tickTo(amb, stage.ref("ratio-n"), BEFORE / AFTER, now + 1100, 1100, (v) => v.toFixed(1), 1);
		riseIn([stage.ref("caption"), stage.ref("caption-2")], 1400);

		await ctx.waitForNext();
		const out = release(amb, [witness, gap], [lock, ends, chip, saved]);
		await ctx.hold(out);
	},

	unmount() {
		host = null;
	},
});
