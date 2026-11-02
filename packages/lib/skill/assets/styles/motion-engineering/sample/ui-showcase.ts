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

interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}

// An element's layout box in stage px, from the offset chain up to .me-content. Offsets
// ignore the camera and the dev player's scaling.
function boxOf(el: HTMLElement): Box {
	let x = 0;
	let y = 0;
	let node: HTMLElement | null = el;
	while (node && !node.classList.contains("me-content")) {
		x += node.offsetLeft;
		y += node.offsetTop;
		const parent = node.offsetParent as HTMLElement | null;
		if (parent && !parent.classList.contains("me-content")) {
			x += parent.clientLeft;
			y += parent.clientTop;
		}
		node = parent;
	}
	return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

// Registration corners: four amber L-brackets close in on a box from outside, settle, and
// blink twice, like autofocus locking on. Release them as marks.
function registerOn(parent: Element, box: Box, delay: number, pad = 14): SVGPathElement[] {
	const { x, y, w, h } = box;
	const amber = { stroke: "var(--amber)", "stroke-width": 3, fill: "none" };
	const arm = 34;
	return [
		[x - pad, y - pad, 1, 1],
		[x + w + pad, y - pad, -1, 1],
		[x - pad, y + h + pad, 1, -1],
		[x + w + pad, y + h + pad, -1, -1],
	].map(([px, py, dx, dy]) => {
		const c = svg(parent, "path", {
			...amber,
			d: `M${px} ${py + dy * arm}V${py}H${px + dx * arm}`,
		});
		c.animate([{ transform: `translate(${-dx * 72}px, ${-dy * 56}px)` }, { transform: "none" }], {
			duration: 640,
			delay,
			easing: css("--ease-settle"),
			fill: "both",
		});
		c.animate(
			[
				{ opacity: 0, easing: "linear" },
				{ opacity: 1, offset: 0.25, easing: "steps(1, end)" },
				{ opacity: 0.2, offset: 0.62, easing: "steps(1, end)" },
				{ opacity: 1, offset: 0.7, easing: "steps(1, end)" },
				{ opacity: 0.2, offset: 0.8, easing: "steps(1, end)" },
				{ opacity: 1, offset: 0.88 },
				{ opacity: 1 },
			],
			{ duration: 900, delay, fill: "both" },
		);
		return c;
	});
}

// A panel measures itself in: its outline draws, the surface fills top-down behind it (the
// clip bleeds past the box so the shadow survives), then the drawn outline hands over to the
// panel's own hairline border. Returns the outline.
function panelIn(stage: Stage, panel: HTMLElement, delay: number, duration = ms("--dur-draw")) {
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
// ── Scene ───────────────────────────────────────────────────────────────────────────────
// UI showcase. A product window at legible scale, never shrunk to fit. It measures itself in
// and its run data fills; then the camera frames one region at a time while an amber
// crosshair marks the interaction point: first the critical task in the waterfall, then the
// cache card. The camera starts and ends at identity, so the grid lines up across cuts.

const WIN = { x: 160, y: 160, w: 1600, h: 760 };
const TASKS = [
	{ name: "install", start: 0, dur: 0.4, cached: true },
	{ name: "build:core", start: 0.4, dur: 2.2, cached: false },
	{ name: "build:cli", start: 0.4, dur: 0.3, cached: true },
	{ name: "test:core", start: 2.6, dur: 4.8, cached: false },
	{ name: "test:cli", start: 0.7, dur: 0.4, cached: true },
	{ name: "bundle", start: 7.4, dur: 0.8, cached: false },
];
const CRITICAL = 3;
const ROW_H = 64;
const BAR_X = 240;
const PX_PER_S = 60;
const NAV = ["Runs", "Pipelines", "Cache", "Agents", "Settings"];
const HATCH =
	"repeating-linear-gradient(135deg, color-mix(in srgb, var(--cyan) 34%, transparent) 0 2px, color-mix(in srgb, var(--cyan) 10%, transparent) 2px 10px)";
const RAN = "color-mix(in srgb, var(--fg-2) 62%, transparent)";
// The bands are covered with the canvas color outright: at 96% the zoomed URL bar still
// ghosted under the HUD label. The grain sits above the mask, so the bands keep their texture.
const DIM = "var(--color-bg)";
// Inner edges of the focus mask: while framed, everything outside them is dimmed, and the
// camera keeps the window's own edges outside them too.
const FOCUS = { left: 136, right: 1784, top: 164, bottom: 916 };
const FADE = 52;

let host: HTMLElement | null = null;
let stage: Stage;

interface Camera {
	tx: number;
	ty: number;
	s: number;
}

export default defineSegment({
	id: "motion-engineering-sample-ui-showcase",
	advances: [2.4, 5.0, 7.6, 8.2],
	voiceover:
		"Every run is a live instrument. Find the critical path in a click. Then watch the cache do the work.",

	async mount(el) {
		await fontsReady();
		host = el;
		stage = buildStage(el, {
			index: "S08 / 10",
			scene: "UI showcase",
			key: { x: 1000, y: 560 },
			scanPhase: 800,
		});
		const nav = NAV.map(
			(item, i) => `
				<div class="me-label" data-ref="nav-${i}" style="position:absolute; left:40px; top:${56 + i * 64}px; color:${i === 0 ? "var(--color-fg)" : "var(--color-muted)"}"></div>`,
		).join("");
		const axis = [0, 2, 4, 6, 8]
			.map(
				(sec) => `
				<div class="me-readout" style="position:absolute; left:${BAR_X + sec * PX_PER_S}px; top:24px; color:var(--color-muted); transform:translateX(${sec ? "-50%" : "0"})">${sec === 8 ? "8 S" : sec}</div>`,
			)
			.join("");
		const rows = TASKS.map(
			(task, i) => `
				<div style="position:absolute; left:0; right:0; top:${64 + i * ROW_H}px; height:${ROW_H}px; border-top:var(--line-hair) solid var(--color-border)">
					<div class="me-mono" data-ref="task-${i}" style="position:absolute; left:24px; top:11px; color:var(--fg-2)"></div>
					<div data-ref="bar-${i}" style="position:absolute; left:${BAR_X + task.start * PX_PER_S}px; top:18px; height:28px; width:0; border-radius:var(--radius-sm); background:${task.cached ? HATCH : RAN}; ${task.cached ? "box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cyan) 55%, transparent)" : ""}"></div>
				</div>`,
		).join("");
		const surface =
			"border:var(--line-hair) solid var(--color-border); border-radius:var(--radius-md); background:var(--surface-2); box-shadow:var(--edge-light)";
		stage.content.innerHTML = `
			<div class="me-panel" data-ref="window" style="position:absolute; left:${WIN.x}px; top:${WIN.y}px; width:${WIN.w}px; height:${WIN.h}px; border-radius:var(--radius-lg); overflow:hidden">
				<div style="position:absolute; left:0; right:0; top:0; height:64px; border-bottom:var(--line-hair) solid var(--color-border); background:var(--surface-2)">
					${[28, 54, 80].map((x) => `<div style="position:absolute; left:${x}px; top:25px; width:14px; height:14px; border-radius:50%; border:var(--line-thin) solid var(--hairline)"></div>`).join("")}
					<div class="me-mono" data-ref="url" style="position:absolute; left:128px; top:11px; color:var(--fg-2)"></div>
				</div>
				<div style="position:absolute; left:0; top:64px; bottom:0; width:280px; border-right:var(--line-hair) solid var(--color-border)">
					<div style="position:absolute; left:0; top:44px; width:3px; height:46px; background:var(--cyan)"></div>
					${nav}
				</div>
				<div class="me-h2" style="position:absolute; left:320px; top:94px">
					<span class="me-line"><span data-ref="run">Run #4182</span></span>
				</div>
				<div data-ref="chips" style="position:absolute; left:760px; top:104px; display:flex; gap:16px">
					<span class="me-chip me-mono" style="color:var(--fg-2)">&#xE0A0; main</span>
					<span class="me-chip me-readout" style="color:var(--ok); padding:19px 16px">✓ PASSED</span>
				</div>
				<div class="me-readout" data-ref="wall" style="position:absolute; right:40px; top:124px; color:var(--color-muted)"></div>
				<div data-ref="waterfall" style="position:absolute; left:320px; top:200px; width:820px; height:520px; ${surface}; overflow:hidden">
					<div class="me-label" style="position:absolute; left:24px; top:24px">Tasks</div>
					${axis}
					<div style="position:absolute; left:${BAR_X}px; top:64px; width:${9 * PX_PER_S}px; bottom:72px; background:repeating-linear-gradient(to right, var(--color-border) 0 1px, transparent 1px ${PX_PER_S}px)"></div>
					${rows}
					<div style="position:absolute; left:24px; bottom:24px; display:flex; gap:40px; align-items:center">
						<span class="me-label" style="display:flex; gap:12px; align-items:center"><span style="width:28px; height:16px; background:${HATCH}; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cyan) 55%, transparent)"></span>Cached</span>
						<span class="me-label" style="display:flex; gap:12px; align-items:center"><span style="width:28px; height:16px; background:${RAN}"></span>Ran</span>
					</div>
				</div>
				<div data-ref="card-cache" style="position:absolute; left:1180px; top:200px; width:380px; height:240px; ${surface}">
					<div class="me-label" style="position:absolute; left:32px; top:32px">Cache hits · 30 d</div>
					<div class="me-h1 me-num" data-ref="hits" style="position:absolute; left:28px; top:76px; color:var(--color-muted)">0%</div>
					<div style="position:absolute; left:32px; top:198px; width:316px; height:2px; background:var(--hairline)"></div>
					<div data-ref="hits-bar" style="position:absolute; left:32px; top:194px; width:0; height:10px; background:var(--cyan)"></div>
				</div>
				<div data-ref="card-cpu" style="position:absolute; left:1180px; top:480px; width:380px; height:240px; ${surface}">
					<div class="me-label" style="position:absolute; left:32px; top:32px">CPU saved · 30 d</div>
					<div style="position:absolute; left:28px; top:76px; display:flex; align-items:baseline; gap:12px">
						<span class="me-h1 me-num" data-ref="cpu">0</span><span class="me-body">hours</span>
					</div>
					<div class="me-readout" style="position:absolute; left:32px; top:188px; color:var(--color-muted)">vs. cold builds</div>
				</div>
				<div class="me-panel" data-ref="popover" style="position:absolute; padding:20px 24px; background:var(--surface-3); box-shadow:var(--edge-light), var(--elev-3); opacity:0">
					<div class="me-label me-signal">Critical path</div>
					<div class="me-mono" style="margin-top:8px; white-space:nowrap">test:core · 4.8 s</div>
				</div>
			</div>`;
		// Focus mask: while the camera frames a region, all four bands outside the safe frame
		// dim, so the zoomed window never fights the HUD readouts and nothing past its edges
		// shows. Fixed, outside the camera.
		const mask = document.createElement("div");
		mask.dataset.ref = "mask";
		const { left, right, top, bottom } = FOCUS;
		mask.style.cssText = `position:absolute; inset:0; z-index:30; pointer-events:none; opacity:0; background:linear-gradient(to bottom, ${DIM} 0 ${top - FADE}px, transparent ${top}px, transparent ${bottom}px, ${DIM} ${bottom + FADE}px), linear-gradient(to right, ${DIM} 0 ${left - 64}px, transparent ${left}px, transparent ${right}px, ${DIM} ${right + 64}px)`;
		stage.world.after(mask);
		stage.ref("run").style.transform = "translateY(112%)";
		const popover = stage.ref("popover");
		const bar = stage.ref(`bar-${CRITICAL}`);
		const barBox = boxOf(bar);
		// Starts just inside the bar, so it clears the end of the build:core bar above it.
		popover.style.left = `${barBox.x - WIN.x - 1 + 16}px`;
		popover.style.top = `${barBox.y - WIN.y - 1 - popover.offsetHeight - 22}px`;
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// Region framing. The camera animates the world's individual translate and scale
		// properties, which compose with the ambient drift the rAF loop writes to transform;
		// the grid takes 60% of the move. Past the window's edges is only ever under the mask.
		let cam: Camera = { tx: 0, ty: 0, s: 1 };
		// Window chrome outside the framed region: anything the mask's fading edge would cut in
		// half (a ghost "WA" of the WALL readout, half a nav label) is hidden with the mask.
		const chrome = ["url", "wall", ...NAV.map((_, i) => `nav-${i}`)].map((ref) => stage.ref(ref));
		const shown = (el: HTMLElement, c: Camera) => {
			if (c.s === 1) return 1;
			const b = boxOf(el);
			const x = 960 + c.tx + c.s * (b.x - 960);
			const y = 540 + c.ty + c.s * (b.y - 540);
			const inside =
				x >= FOCUS.left &&
				x + c.s * b.w <= FOCUS.right &&
				y >= FOCUS.top &&
				y + c.s * b.h <= FOCUS.bottom;
			return inside ? 1 : 0;
		};
		const moveCamera = (to: Camera, duration: number, delay = 0) => {
			const timing = { duration, delay, easing: css("--ease-draw"), fill: "both" as const };
			for (const el of chrome) {
				el.animate([{ opacity: shown(el, cam) }, { opacity: shown(el, to) }], {
					...timing,
					easing: "linear",
				});
			}
			const at = (c: Camera, k: number) => ({
				translate: `${(c.tx * k).toFixed(2)}px ${(c.ty * k).toFixed(2)}px`,
				scale: `${(1 + (c.s - 1) * k).toFixed(4)}`,
			});
			stage.world.animate([at(cam, 1), at(to, 1)], timing);
			stage.grid.animate([at(cam, 0.6), at(to, 0.6)], timing);
			const framed = (c: Camera) => (c.s > 1 ? 1 : 0);
			stage.ref("mask").animate([{ opacity: framed(cam) }, { opacity: framed(to) }], {
				...timing,
				easing: "linear",
			});
			cam = to;
		};
		// Fit the region inside the mask's inner edges (FOCUS), centre it, then clamp the move so
		// the window's edges stay at or beyond them. Screen x of a world x is
		// 960 + tx + zoom * (x - 960) (y: 540).
		const frameOn = (r: Box): Camera => {
			const zoom = Math.min(
				1.4,
				(FOCUS.right - FOCUS.left) / r.w,
				(FOCUS.bottom - FOCUS.top) / r.h,
			);
			const fit = (
				want: number,
				near: number,
				far: number,
				lo: number,
				hi: number,
				mid: number,
			) => {
				const max = lo - mid - zoom * (near - mid);
				const min = hi - mid - zoom * (far - mid);
				// A window smaller than the focus area at this zoom stays centred on it.
				return min > max ? (min + max) / 2 : Math.max(min, Math.min(max, want));
			};
			return {
				s: zoom,
				tx: fit(-zoom * (r.x + r.w / 2 - 960), WIN.x, WIN.x + WIN.w, FOCUS.left, FOCUS.right, 960),
				ty: fit(-zoom * (r.y + r.h / 2 - 540), WIN.y, WIN.y + WIN.h, FOCUS.top, FOCUS.bottom, 540),
			};
		};

		// draw: the window measures itself in; fill: chrome, header, rows and bars.
		panelIn(stage, stage.ref("window"), 0);
		decode(amb, stage.ref("url"), "apogee.cloud/runs/4182", amb.now() + 300);
		NAV.forEach((item, i) => {
			decode(amb, stage.ref(`nav-${i}`), item.toUpperCase(), amb.now() + 420 + i * 60);
		});
		riseIn([stage.ref("run")], 380);
		stage.ref("chips").animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: ms("--dur-normal"), delay: 560, easing: css("--ease-settle"), fill: "both" },
		);
		decode(amb, stage.ref("wall"), "WALL 8.2 S", amb.now() + 700);
		const surfaces = ["waterfall", "card-cache", "card-cpu"];
		surfaces.forEach((ref, i) => {
			panelIn(stage, stage.ref(ref), 360 + i * ms("--stagger"), 600);
		});
		TASKS.forEach((task, i) => {
			decode(amb, stage.ref(`task-${i}`), task.name, amb.now() + 760 + i * 50);
			const bar = stage.ref(`bar-${i}`);
			const start = amb.now() + 960 + task.start * 90;
			const width = Math.max(task.dur * PX_PER_S, 16);
			amb.add((t) => {
				const p = clamp01(tidy(t - start) / 420);
				bar.style.width = `${(width * drawEase(p)).toFixed(2)}px`;
				return p < 1;
			});
		});
		tickTo(amb, stage.ref("cpu"), 37, amb.now() + 1100, 900, (v) => String(Math.round(v)));
		decode(amb, stage.ref("probe"), "RUN 4182 · 6 TASKS", amb.now() + 900);

		// The crosshair: an amber reticle that marks where the viewer would click.
		const cross = svg(s, "g", {
			fill: "none",
			style: "filter: var(--glow-amber-filter); opacity: 0",
		});
		for (const [stroke, width] of [
			["var(--color-bg)", 7],
			["var(--amber)", 3],
		] as const) {
			svg(cross, "path", {
				d: "M-26 0h16M10 0h16M0 -26v16M0 10v16",
				stroke,
				"stroke-width": width,
			});
		}
		svg(cross, "circle", { r: 4, fill: "var(--amber)" });
		let at = { x: 0, y: 0 };
		const travel = (to: { x: number; y: number }, delay: number, duration: number) => {
			cross.animate(
				[
					{ transform: `translate(${at.x}px, ${at.y}px)` },
					{ transform: `translate(${to.x}px, ${to.y}px)` },
				],
				{ duration, delay, easing: css("--ease-settle"), fill: "both" },
			);
			at = to;
		};
		const click = (p: { x: number; y: number }, delay: number) => {
			const ring = svg(s, "circle", {
				cx: p.x,
				cy: p.y,
				r: 10,
				fill: "none",
				stroke: "var(--amber)",
				"stroke-width": 2,
				opacity: 0,
			});
			ring.style.transformOrigin = `${p.x}px ${p.y}px`;
			ring.animate(
				[
					{ transform: "scale(1)", opacity: 0.9 },
					{ transform: "scale(4)", opacity: 0 },
				],
				// Hidden until the click lands (forwards, not both: the first keyframe must not
				// show during the delay).
				{ duration: 520, delay, easing: css("--ease-settle"), fill: "forwards" },
			);
		};

		await ctx.waitForNext();
		// Beat 1 ("Find the critical path in a click."): the camera frames the waterfall, the
		// crosshair travels to the long pole, clicks, and the popover reports the path.
		const now = amb.now();
		// Frame the waterfall with the run header above it, so the header stays inside the
		// safe area as context; the second cue pans across at the same zoom.
		const header = boxOf(stage.ref("run").parentElement?.parentElement as HTMLElement);
		const waterfall = boxOf(stage.ref("waterfall"));
		const top = header.y - 16;
		const height = waterfall.y + waterfall.h - top;
		moveCamera(frameOn({ x: waterfall.x, y: top, w: waterfall.w, h: height }), 1000);
		const bar = boxOf(stage.ref(`bar-${CRITICAL}`));
		const target = {
			x: bar.x + (TASKS[CRITICAL].dur * PX_PER_S) / 2,
			y: bar.y + bar.h / 2,
		};
		at = { x: target.x + 300, y: target.y - 240 };
		cross.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 300, fill: "both" });
		travel(target, 500, 760);
		click(target, 1300);
		stage
			.ref(`bar-${CRITICAL}`)
			.animate(
				[{ background: RAN }, { background: "var(--amber)", boxShadow: "var(--glow-amber)" }],
				{
					duration: ms("--dur-fast"),
					delay: 1340,
					fill: "both",
				},
			);
		const popover = stage.ref("popover");
		popover.animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: ms("--dur-normal"), delay: 1500, easing: css("--ease-settle"), fill: "both" },
		);
		decode(amb, stage.ref("probe"), "SELECT TEST:CORE · 4.8 S", now + 1400);

		await ctx.waitForNext();
		// Beat 2 ("Then watch the cache do the work."): the popover closes, the camera pans to
		// the cache card, the crosshair follows to its meter, and the hit rate ticks in.
		const later = amb.now();
		popover.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: ms("--dur-fast"),
			easing: css("--ease-exit"),
			fill: "forwards",
		});
		stage
			.ref(`bar-${CRITICAL}`)
			.animate(
				[{ background: "var(--amber)", boxShadow: "var(--glow-amber)" }, { background: RAN }],
				{
					duration: ms("--dur-normal"),
					fill: "forwards",
				},
			);
		const card = boxOf(stage.ref("card-cache"));
		moveCamera(frameOn({ x: card.x, y: top, w: card.w, h: height }), 1000);
		const meter = boxOf(stage.ref("hits-bar"));
		const tip = { x: meter.x + 316 * 0.94, y: meter.y + meter.h / 2 };
		travel(tip, 200, 760);
		click(tip, 1000);
		flare(stage, tip.x, tip.y, 1000);
		// The meter grows and the value ticks together, once the click lands.
		const hitsBar = stage.ref("hits-bar");
		const hits = stage.ref("hits");
		const fillAt = later + 1040;
		const step = ms("--dur-tick") || 50;
		amb.add((t) => {
			if (t < fillAt) return true;
			const local = tidy(t - fillAt);
			const p = clamp01(local / 900);
			hitsBar.style.width = `${(316 * 0.94 * drawEase(p)).toFixed(2)}px`;
			hits.textContent = `${Math.round(94 * expoOut((Math.floor(local / step) * step) / 900))}%`;
			return p < 1;
		});
		const lit = { duration: 1, delay: 1040, fill: "both" as const };
		hitsBar.animate([{ background: "var(--cyan)" }, { background: "var(--amber)" }], lit);
		hits.animate([{ color: "var(--color-muted)" }, { color: "var(--amber)" }], lit);
		decode(amb, stage.ref("probe"), "CACHE 47 OF 50 TASKS", later + 1100);

		await ctx.waitForNext();
		// Release cue: the camera rests to identity; the crosshair lets go. The card stays lit.
		const out = release(amb, [], [cross]);
		moveCamera({ tx: 0, ty: 0, s: 1 }, out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		host = null;
	},
});
