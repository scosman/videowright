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
// Grid. Six peers in a 3 × 2 grid of panels that sit on the grid's own lines. The frames
// draw in reading order and name their targets; on the first cue each cell measures its
// build: the time ticks, a cyan bar measures it on a shared scale (1 cell = 1 s), the pass
// decodes. On the second cue one cell becomes the signal: corners lock on, it turns amber,
// the rest recede.

const TARGETS = [
	{ os: "Linux · x64", time: 3.8 },
	{ os: "Linux · arm64", time: 4.4 },
	{ os: "macOS · arm64", time: 3.1 },
	{ os: "macOS · x64", time: 4.9 },
	{ os: "Windows · x64", time: 5.6 },
	{ os: "wasm32", time: 2.7 },
];
const SIGNAL = 5;
const CELL = { w: 480, h: 240 };
const CELL_X = [160, 720, 1280];
const CELL_Y = [380, 660];
const PX_PER_S = 40;
const SCALE_S = 7;

let host: HTMLElement | null = null;
let stage: Stage;

export default defineSegment({
	id: "motion-engineering-sample-grid",
	advances: [1.8, 4.6, 7.2, 7.8],
	voiceover:
		"One config, six targets. Linux, macOS and Windows. And new in two point oh: WebAssembly.",

	async mount(el) {
		await fontsReady();
		host = el;
		stage = buildStage(el, {
			index: "S07 / 10",
			scene: "Grid",
			key: { x: 1500, y: 760 },
			scanPhase: 5200,
		});
		// Children sit 1px inside the panel border, so 39px lands the scale on a grid line.
		const cells = TARGETS.map((_, i) => {
			const x = CELL_X[i % 3];
			const y = CELL_Y[Math.floor(i / 3)];
			return `
				<div class="me-panel" data-ref="cell-${i}" style="position:absolute; left:${x}px; top:${y}px; width:${CELL.w}px; height:${CELL.h}px">
					<div class="me-label" data-ref="os-${i}" style="position:absolute; left:39px; top:32px; color:var(--fg-2)"></div>
					<div class="me-label me-signal" data-ref="tag-${i}" style="position:absolute; right:39px; top:32px"></div>
					<div style="position:absolute; left:33px; top:68px; display:flex; align-items:baseline; gap:12px">
						<span class="me-h1 me-num" data-ref="time-${i}"></span>
						<span class="me-body" data-ref="unit-${i}" style="opacity:0">s</span>
					</div>
					<div style="position:absolute; left:39px; top:196px; width:${SCALE_S * PX_PER_S + 2}px; height:10px; background:linear-gradient(var(--hairline), var(--hairline)) 0 0 / 100% 2px no-repeat, repeating-linear-gradient(to right, var(--hairline) 0 2px, transparent 2px ${PX_PER_S}px) 0 2px / 100% 8px no-repeat"></div>
					<div data-ref="bar-${i}" style="position:absolute; left:39px; top:182px; width:0; height:12px; background:var(--cyan)"></div>
					<div class="me-readout" data-ref="pass-${i}" style="position:absolute; right:39px; top:190px; color:var(--ok)"></div>
				</div>`;
		}).join("");
		stage.content.innerHTML = `
			<div class="me-label" data-ref="kicker" style="position:absolute; left:160px; top:170px; color:var(--fg-2)"></div>
			<div class="me-h1" style="position:absolute; left:154px; top:206px">
				<span class="me-line"><span data-ref="heading">Six targets. One config.</span></span>
			</div>
			${cells}`;
		stage.ref("heading").style.transform = "translateY(112%)";
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// fill (from frame 1): the heading rises; draw: the cells measure themselves in, in
		// reading order, and name their targets.
		decode(amb, stage.ref("kicker"), "Build matrix · 2.0", amb.now() + 60);
		riseIn([stage.ref("heading")], 0);
		TARGETS.forEach((target, i) => {
			panelIn(stage, stage.ref(`cell-${i}`), 120 + i * ms("--stagger"));
			decode(amb, stage.ref(`os-${i}`), target.os.toUpperCase(), amb.now() + 640 + i * 60);
		});
		decode(amb, stage.ref("probe"), "MATRIX 3 × 2 · 6 TARGETS", amb.now() + 900);

		await ctx.waitForNext();
		// Beat 1 ("Linux, macOS and Windows."): each cell measures its build, in reading
		// order. The time ticks; the bar grows on the shared scale in step with it.
		const step = ms("--dur-tick") || 50;
		const fillFor = 900;
		TARGETS.forEach((target, i) => {
			const start = amb.now() + i * 140;
			const bar = stage.ref(`bar-${i}`);
			const time = stage.ref(`time-${i}`);
			amb.add((t) => {
				const local = tidy(Math.max(0, t - start));
				if (t < start) return true;
				const p = Math.min(local / fillFor, 1);
				bar.style.width = `${(target.time * PX_PER_S * drawEase(p)).toFixed(2)}px`;
				const q = Math.min((Math.floor(local / step) * step) / fillFor, 1);
				time.textContent = (target.time * expoOut(q)).toFixed(1);
				return p < 1;
			});
			stage.ref(`unit-${i}`).animate(
				[
					{ opacity: 0, transform: "translateY(30%)" },
					{ opacity: 1, transform: "none" },
				],
				{
					duration: ms("--dur-normal"),
					delay: i * 140,
					easing: css("--ease-settle"),
					fill: "both",
				},
			);
			decode(amb, stage.ref(`pass-${i}`), "✓ PASS", start + fillFor - 100);
		});
		decode(amb, stage.ref("probe"), "SCALE 1 CELL = 1.0 S", amb.now() + 300);

		await ctx.waitForNext();
		// Beat 2 ("And new in two point oh: WebAssembly."): one step at a time. Corners lock
		// onto the new target, the grid answers, its measurement turns amber, the tag decodes,
		// and its peers step back.
		const cell = stage.ref(`cell-${SIGNAL}`);
		const box = boxOf(cell);
		const corners = registerOn(s, box, 0);
		flare(stage, box.x + box.w / 2, box.y + box.h / 2, 420);
		amb.nudge(0.008, ms("--dur-slow") * 1.4);
		const lit = { duration: ms("--dur-fast"), delay: 520, fill: "both" as const };
		stage
			.ref(`bar-${SIGNAL}`)
			.animate(
				[
					{ background: "var(--cyan)" },
					{ background: "var(--amber)", boxShadow: "var(--glow-amber)" },
				],
				lit,
			);
		stage
			.ref(`time-${SIGNAL}`)
			.animate([{ color: "var(--color-fg)" }, { color: "var(--amber)" }], lit);
		decode(amb, stage.ref(`tag-${SIGNAL}`), "NEW IN 2.0", amb.now() + 700);
		TARGETS.forEach((_, i) => {
			if (i === SIGNAL) return;
			stage.ref(`cell-${i}`).animate([{ opacity: 1 }, { opacity: 0.5 }], {
				duration: ms("--dur-normal"),
				delay: 760,
				easing: css("--ease-settle"),
				fill: "forwards",
			});
		});
		decode(amb, stage.ref("probe"), "WASM32 · 1.4 MB BUNDLE", amb.now() + 800);

		await ctx.waitForNext();
		// Release cue: the corners let go; the amber cell is the payoff and stays.
		const out = release(amb, [], corners);
		await ctx.hold(out);
	},

	unmount() {
		host = null;
	},
});
