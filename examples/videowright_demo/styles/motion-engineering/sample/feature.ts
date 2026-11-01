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
// Feature. One capability, shown working. The claim sits on the left; on the right a panel
// measures itself in and its task graph draws top-down. On the first cue the HUD locks onto
// the changed file and the signal travels down its path, task by task; on the second the
// rest of the graph replays from cache in cyan. Amber stays on the changed path throughout:
// it is the subject.

const PANEL = { x: 760, y: 210, w: 1000, h: 660 };
const COL = [960, 1280];
const ROW = [350, 490, 630, 770];
const NODE = { w: 260, h: 72 };
const CALLOUT_X = 1470;

interface TaskNode {
	id: string;
	label: string;
	x: number;
	y: number;
	file?: boolean;
}

const NODES: TaskNode[] = [
	{ id: "cli", label: "cli.ts", x: COL[0], y: ROW[0], file: true },
	{ id: "cache", label: "cache.ts", x: COL[1], y: ROW[0], file: true },
	{ id: "build-cli", label: "build:cli", x: COL[0], y: ROW[1] },
	{ id: "build-core", label: "build:core", x: COL[1], y: ROW[1] },
	{ id: "test-cli", label: "test:cli", x: COL[0], y: ROW[2] },
	{ id: "test-core", label: "test:core", x: COL[1], y: ROW[2] },
	{ id: "bundle", label: "bundle", x: (COL[0] + COL[1]) / 2, y: ROW[3] },
];
const node = (id: string) => NODES.find((n) => n.id === id) as TaskNode;

// Edge geometry: straight down a column, or an elbow into the bundle.
function edgePath(from: string, to: string): string {
	const a = node(from);
	const b = node(to);
	const y0 = a.y + NODE.h / 2;
	const y1 = b.y - NODE.h / 2;
	if (a.x === b.x) return `M${a.x} ${y0} V${y1}`;
	const inX = b.x + (a.x < b.x ? -40 : 40);
	const elbow = (y0 + y1) / 2;
	return `M${a.x} ${y0} V${elbow} H${inX} V${y1}`;
}
const edgeEnd = (from: string, to: string) => ({
	x: node(to).x + (node(from).x === node(to).x ? 0 : node(from).x < node(to).x ? -40 : 40),
	y: node(to).y - NODE.h / 2,
});

const CHANGED_PATH = ["cache", "build-core", "test-core", "bundle"];
const CACHED_PATH = ["cli", "build-cli", "test-cli", "bundle"];
// The bundle was rebuilt on the changed path; the cached path only feeds it.
const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

let host: HTMLElement | null = null;
let stage: Stage;

export default defineSegment({
	id: "motion-engineering-sample-feature",
	advances: [2.4, 5.4, 7.8, 8.4],
	voiceover:
		"The task graph knows what changed. Edit one file, and only its path rebuilds. Everything else replays from cache.",

	async mount(el) {
		await fontsReady();
		host = el;
		stage = buildStage(el, {
			index: "S06 / 10",
			scene: "Feature",
			key: { x: 1260, y: 540 },
			scanPhase: 3400,
		});
		const nodes = NODES.map(
			(n) => `
				<div data-ref="node-${n.id}" style="position:absolute; left:${n.x - NODE.w / 2}px; top:${n.y - NODE.h / 2}px; width:${NODE.w}px; height:${NODE.h}px; border-radius:var(--radius-sm); ${
					n.file
						? "border:var(--line-hair) dashed var(--hairline)"
						: "border:var(--line-hair) solid var(--color-border); background:var(--surface-2); box-shadow:var(--edge-light)"
				}">
					<span class="me-mono" data-ref="label-${n.id}" style="position:absolute; left:22px; top:15px; color:${n.file ? "var(--fg-2)" : "var(--color-fg)"}"></span>
					<span class="me-mono" data-ref="status-${n.id}" style="position:absolute; right:22px; top:15px; color:var(--color-muted)"></span>
				</div>`,
		).join("");
		const callout = (ref: string, y: number) => `
			<div data-ref="${ref}" style="position:absolute; left:${CALLOUT_X + 16}px; top:${y - 34}px">
				<div class="me-label" style="color:var(--fg-2)"><span class="me-line"><span data-ref="${ref}-label"></span></span></div>
				<div class="me-mono me-signal" data-ref="${ref}-value" style="margin-top:6px; font-weight:560"></div>
			</div>`;
		stage.content.innerHTML = `
			<div class="me-label" data-ref="kicker" style="position:absolute; left:160px; top:282px; color:var(--fg-2)"></div>
			<div class="me-h1" style="position:absolute; left:154px; top:320px">
				<span class="me-line"><span data-ref="h-0">Only what</span></span>
				<span class="me-line"><span data-ref="h-1">changed</span></span>
				<span class="me-line"><span data-ref="h-2">rebuilds.</span></span>
			</div>
			<div class="me-body" style="position:absolute; left:160px; top:648px; width:540px">
				<span class="me-line"><span data-ref="body-0">Every input is hashed, so</span></span>
				<span class="me-line"><span data-ref="body-1">an edit rebuilds its own path</span></span>
				<span class="me-line"><span data-ref="body-2">and nothing else.</span></span>
			</div>
			<div class="me-panel" data-ref="panel" style="position:absolute; left:${PANEL.x}px; top:${PANEL.y}px; width:${PANEL.w}px; height:${PANEL.h}px">
				<div style="position:absolute; left:0; right:0; top:0; height:64px; border-bottom:var(--line-hair) solid var(--color-border)"></div>
				<div class="me-mono" data-ref="bar-title" style="position:absolute; left:32px; top:12px; color:var(--fg-2)"></div>
				<div class="me-readout" data-ref="bar-count" style="position:absolute; right:32px; top:22px; color:var(--color-muted)"></div>
			</div>
			${nodes}
			${callout("changed", ROW[0])}
			${callout("rebuilt", ROW[3])}`;
		for (const ref of ["h-0", "h-1", "h-2", "body-0", "body-1", "body-2"]) {
			stage.ref(ref).style.transform = "translateY(112%)";
		}
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;
		const status = (id: string) => stage.ref(`status-${id}`);
		const box = (id: string) => stage.ref(`node-${id}`);

		// fill (from frame 1): the claim rises on the left.
		decode(amb, stage.ref("kicker"), "Incremental builds", amb.now() + 60);
		riseIn(["h-0", "h-1", "h-2"].map(stage.ref), 80);
		riseIn(["body-0", "body-1", "body-2"].map(stage.ref), 420, ms("--dur-normal"));

		// draw: the panel measures itself in, then the graph draws top-down, row by row.
		panelIn(stage, stage.ref("panel"), 0);
		decode(amb, stage.ref("bar-title"), "apogee build --watch", amb.now() + 420);
		decode(amb, stage.ref("bar-count"), "5 TASKS", amb.now() + 560);
		const rowDelay = (y: number) => 520 + ROW.indexOf(y) * 170;
		NODES.forEach((n, i) => {
			panelIn(stage, box(n.id), rowDelay(n.y), 420);
			decode(amb, stage.ref(`label-${n.id}`), n.label, amb.now() + rowDelay(n.y) + 260 + i * 20);
			if (!n.file) decode(amb, status(n.id), "○", amb.now() + rowDelay(n.y) + 420);
		});
		const hairline = { stroke: "var(--hairline)", "stroke-width": 2, fill: "none" };
		const EDGES: Array<[string, string]> = [
			["cli", "build-cli"],
			["cache", "build-core"],
			["build-cli", "test-cli"],
			["build-core", "test-core"],
			["test-cli", "bundle"],
			["test-core", "bundle"],
		];
		const arrow = (parent: Element, from: string, to: string, attrs: Attrs) => {
			const { x, y } = edgeEnd(from, to);
			return svg(parent, "path", {
				...attrs,
				d: `M${x - 7} ${y - 9} L${x} ${y - 1} L${x + 7} ${y - 9}`,
			});
		};
		for (const [from, to] of EDGES) {
			const at = rowDelay(node(from).y) + 300;
			draw(svg(s, "path", { ...hairline, d: edgePath(from, to) }), at, 300);
			arrow(s, from, to, hairline).animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 1,
				delay: at + 300,
				fill: "both",
			});
		}
		decode(amb, stage.ref("probe"), "WATCHING 2 FILES", amb.now() + 1500);

		// The signal runs along a path: each edge draws, then its task spins and resolves.
		const runPath = (
			path: string[],
			color: string,
			at: number,
			step: number,
			spin: number,
			resolveLast = true,
		) => {
			// Amber is the subject and glows; the cached path is quieter.
			const signal = color === "var(--amber)";
			const overlay = svg(s, "g", {
				stroke: color,
				"stroke-width": signal ? 3 : 2,
				fill: "none",
				style: signal ? "filter: var(--glow-amber-filter)" : "",
			});
			const border = signal ? color : `color-mix(in srgb, ${color} 60%, transparent)`;
			const ring = signal ? `0 0 0 1px ${color}, var(--edge-light)` : "var(--edge-light)";
			const start = amb.now() + at;
			path.slice(1).forEach((id, k) => {
				const edgeAt = at + k * step;
				const edge = svg(overlay, "path", { d: edgePath(path[k], id) });
				draw(edge, edgeAt, step * 0.55);
				arrow(overlay, path[k], id, {}).animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 1,
					delay: edgeAt + step * 0.55,
					fill: "both",
				});
				if (!resolveLast && k === path.length - 2) return;
				const lit = edgeAt + step * 0.5;
				box(id).animate(
					[{ borderColor: "var(--color-border)" }, { borderColor: border, boxShadow: ring }],
					{ duration: ms("--dur-fast"), delay: lit, fill: "both" },
				);
				const spinFrom = start + k * step + step * 0.5;
				const doneAt = spinFrom + spin;
				const el = status(id);
				amb.add((t) => {
					if (t < spinFrom) return true;
					if (t < doneAt) {
						el.textContent = SPINNER[Math.floor(tidy(t - spinFrom) / 60) % SPINNER.length];
						el.style.color = color;
						return true;
					}
					el.textContent = "✓";
					return false;
				});
			});
		};

		await ctx.waitForNext();
		// Beat 1 ("Edit one file…"): lock on the changed file, call it out, then the signal
		// travels down its path and the bundle reports what was rebuilt.
		const now = amb.now();
		const cache = node("cache");
		const corners = registerOn(s, boxOf(box("cache")), 0, 10);
		flare(stage, cache.x, cache.y, 380);
		box("cache").animate([{ borderColor: "var(--hairline)" }, { borderColor: "var(--amber)" }], {
			duration: ms("--dur-fast"),
			delay: 300,
			fill: "both",
		});

		const callout = (ref: string, n: TaskNode, delay: number, label: string) => {
			const x0 = n.x + NODE.w / 2;
			const pin = svg(s, "circle", { cx: x0, cy: n.y, r: 5, fill: "var(--amber)" });
			pin.style.transformOrigin = `${x0}px ${n.y}px`;
			pin.animate(
				[
					{ transform: "scale(2.6)", opacity: 0 },
					{ transform: "none", opacity: 1 },
				],
				{
					duration: ms("--dur-normal"),
					delay,
					easing: css("--ease-settle"),
					fill: "both",
				},
			);
			const leader = svg(s, "path", {
				d: `M${x0 + 8} ${n.y} H${CALLOUT_X}`,
				stroke: "var(--amber)",
				"stroke-width": 2,
				fill: "none",
			});
			draw(leader, delay + 120, 260);
			stage.ref(`${ref}-label`).textContent = label;
			stage.ref(`${ref}-label`).style.transform = "translateY(112%)";
			riseIn([stage.ref(`${ref}-label`)], delay + 300, ms("--dur-normal"));
			return { pin, leader };
		};
		const changed = callout("changed", cache, 420, "Changed");
		decode(amb, stage.ref("changed-value"), "1 file", now + 560);
		decode(amb, stage.ref("probe"), "DELTA 1 OF 2 FILES", now + 420);

		const STEP = 340;
		const PATH_AT = 800;
		runPath(CHANGED_PATH, "var(--amber)", PATH_AT, STEP, 300);
		const doneAt = PATH_AT + (CHANGED_PATH.length - 2) * STEP + STEP * 0.5 + 300;
		const rebuilt = callout("rebuilt", node("bundle"), doneAt, "Rebuilt");
		stage.ref("rebuilt-value").textContent = "3 of 5 · 0.0 s";
		stage.ref("rebuilt-value").animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 1,
			delay: doneAt + 300,
			fill: "both",
		});
		tickTo(
			amb,
			stage.ref("rebuilt-value"),
			2.1,
			now + doneAt + 300,
			600,
			(v) => `3 of 5 · ${v.toFixed(1)} s`,
		);

		await ctx.waitForNext();
		// Beat 2 ("Everything else replays from cache."): the untouched column resolves fast,
		// in cyan; the header reports the split.
		runPath(CACHED_PATH, "var(--cyan)", 0, 150, 90, false);
		decode(amb, stage.ref("bar-count"), "3 BUILT · 2 CACHED", amb.now() + 300);
		decode(amb, stage.ref("probe"), "CACHE HIT 2 OF 5 TASKS", amb.now() + 300);

		await ctx.waitForNext();
		// Release cue: leaders and corners let go; the graph, its colors and the readings stay.
		const out = release(
			amb,
			[changed.leader, rebuilt.leader],
			[...corners, changed.pin, rebuilt.pin],
		);
		await ctx.hold(out);
	},

	unmount() {
		host = null;
	},
});
