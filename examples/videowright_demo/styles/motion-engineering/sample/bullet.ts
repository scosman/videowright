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
// Bullets on a spine. Each item arrives on its cue: its node locks onto the spine, a leader
// draws to the text, the text rises, and a dotted leader carries the item's measured result
// to a readout at the right edge. The newest item is the focal point; earlier ones recede.

const ITEMS = [
	{ title: "Incremental task graph", note: "Only what changed rebuilds.", result: "−62% REBUILD" },
	{ title: "Shared remote cache", note: "One build, every machine.", result: "94% HIT RATE" },
	{ title: "Deterministic outputs", note: "Same inputs, same bytes.", result: "BIT-EXACT ✓" },
];
const SPINE_X = 200;
const ROW = (i: number) => 420 + i * 180;

let host: HTMLElement | null = null;
let stage: Stage;
let resultWidth: number[] = [];

export default defineSegment({
	id: "motion-engineering-sample-bullet",
	advances: [1.4, 3.2, 5.0, 7.0, 7.6],
	voiceover:
		"What's new in two point oh. An incremental task graph. A shared remote cache. And deterministic outputs.",

	async mount(el) {
		await fontsReady();
		host = el;
		stage = buildStage(el, {
			index: "S04 / 10",
			scene: "Bullets",
			key: { x: 760, y: 600 },
			scanPhase: 6900,
		});
		const rows = ITEMS.map(
			(item, i) => `
				<div data-ref="item-${i}" style="position:absolute; left:${SPINE_X + 80}px; top:${ROW(i) - 32}px; width:${1760 - SPINE_X - 80}px">
					<div class="me-mono me-signal" data-ref="index-${i}" style="position:absolute; left:0; top:10px"></div>
					<div class="me-h2" style="position:absolute; left:88px; top:-4px; white-space:nowrap">
						<span class="me-line"><span data-ref="title-${i}">${item.title}</span></span>
					</div>
					<div class="me-body" style="position:absolute; left:88px; top:80px">
						<span class="me-line"><span data-ref="note-${i}">${item.note}</span></span>
					</div>
					<div class="me-mono me-measure" data-ref="result-${i}" style="position:absolute; right:0; top:14px; font-weight:560"></div>
				</div>`,
		).join("");
		stage.content.innerHTML = `
			<div class="me-label" data-ref="kicker" style="position:absolute; left:160px; top:170px; color:var(--fg-2)"></div>
			<div class="me-h1" style="position:absolute; left:154px; top:206px">
				<span class="me-line"><span data-ref="heading">What’s new in 2.0</span></span>
			</div>
			${rows}`;
		resultWidth = ITEMS.map((item, i) => {
			const node = stage.ref(`result-${i}`);
			node.textContent = item.result;
			const width = node.offsetWidth;
			node.textContent = "";
			return width;
		});
		for (const r of ["heading", ...ITEMS.flatMap((_, i) => [`title-${i}`, `note-${i}`])]) {
			stage.ref(r).style.transform = "translateY(112%)";
		}
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// draw: the spine and its sockets; fill: the heading.
		const spine = svg(s, "path", {
			d: `M${SPINE_X} ${ROW(0) - 70} V${ROW(ITEMS.length - 1) + 110}`,
			stroke: "var(--hairline)",
			"stroke-width": 2,
			fill: "none",
		});
		draw(spine, 0, ms("--dur-slow"));
		// Sockets mark where each item will lock on, so the spine reads as a plan before the
		// items arrive.
		for (let i = 0; i < ITEMS.length; i++) {
			const socket = svg(s, "path", {
				d: `M${SPINE_X - 8} ${ROW(i)} h16`,
				stroke: "var(--hairline)",
				"stroke-width": 2,
			});
			socket.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 1,
				delay: ((ROW(i) - ROW(0) + 70) / (ROW(ITEMS.length - 1) + 180 - ROW(0))) * ms("--dur-slow"),
				fill: "both",
			});
		}
		riseIn([stage.ref("heading")], 120);
		decode(amb, stage.ref("kicker"), "Release notes · 2.0", amb.now() + 60);

		const nodes: SVGCircleElement[] = [];
		const strokes: SVGGeometryElement[] = [];
		const marks: Element[] = [];
		const arrive = (i: number) => {
			const y = ROW(i);
			const node = svg(s, "circle", {
				cx: SPINE_X,
				cy: y,
				r: 9,
				fill: "var(--color-bg)",
				stroke: "var(--amber)",
				"stroke-width": 3,
			});
			node.style.transformOrigin = `${SPINE_X}px ${y}px`;
			node.animate(
				[
					{ transform: "scale(2.6)", opacity: 0 },
					{ transform: "none", opacity: 1 },
				],
				{
					duration: ms("--dur-normal"),
					easing: css("--ease-settle"),
					fill: "both",
				},
			);
			flare(stage, SPINE_X, y, 200);
			const leader = svg(s, "path", {
				d: `M${SPINE_X + 12} ${y} H${SPINE_X + 64}`,
				stroke: "var(--amber)",
				"stroke-width": 2,
				fill: "none",
			});
			draw(leader, 120, 260);
			decode(amb, stage.ref(`index-${i}`), String(i + 1).padStart(2, "0"), amb.now() + 200);
			riseIn([stage.ref(`title-${i}`)], 220);
			riseIn([stage.ref(`note-${i}`)], 340);

			// The result travels out on a dotted leader to the right edge, then decodes.
			const from = SPINE_X + 80 + 88 + stage.ref(`title-${i}`).offsetWidth + 36;
			const to = 1760 - resultWidth[i] - 28;
			marks.push(dottedLeader(stage, from, to, y, 520));
			decode(amb, stage.ref(`result-${i}`), ITEMS[i].result, amb.now() + 1100, 30);
			decode(
				amb,
				stage.ref("probe"),
				`ITEM ${String(i + 1).padStart(2, "0")} / 03`,
				amb.now() + 200,
			);

			// The previous item recedes: its node, leader and index turn cyan, its text steps back.
			if (i > 0) {
				stage.ref(`item-${i - 1}`).animate([{ opacity: 1 }, { opacity: 0.5 }], {
					duration: ms("--dur-normal"),
					easing: css("--ease-settle"),
					fill: "forwards",
				});
				nodes[i - 1].setAttribute("stroke", "var(--cyan)");
				strokes[i - 1].setAttribute("stroke", "var(--cyan)");
				stage.ref(`index-${i - 1}`).style.color = "var(--cyan)";
			}
			nodes.push(node);
			strokes.push(leader);
		};

		for (let i = 0; i < ITEMS.length; i++) {
			await ctx.waitForNext();
			arrive(i);
		}

		await ctx.waitForNext();
		const out = release(amb, strokes, marks);
		await ctx.hold(out);
	},

	unmount() {
		host = null;
	},
});
