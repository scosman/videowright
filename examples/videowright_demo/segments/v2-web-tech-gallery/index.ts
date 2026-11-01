import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { hudProbe, registerOn, release, showHud } from "../../components/v2/hud.js";
import { css, draw, ms, riseIn, svg } from "../../components/v2/motion.js";
import {
	type Box,
	type Stage,
	boxOf,
	createStage,
	flare,
	startAmbient,
} from "../../components/v2/stage.js";
import { sweepReveal } from "../../components/v2/sweep.js";
import { type AppDemo, createApp } from "./app.js";
import { type ChartsDemo, createCharts } from "./charts.js";
import { type GearsDemo, createGears } from "./gears.js";
import { LAUNCH_FRAME, type SpaceDemo, createSpace } from "./space.js";

// Beat 3: "any web technologies", shown working. One claim holds the left rail for the whole
// beat, over a 4-step spine that names each technology as it plays; the demo viewport on the
// right swaps on each VO cue under the style's signature sweep: a self-drawing SVG gear train,
// real ECharts, a real Three.js scene beside the real Lottie rocket, and a real product UI that
// a cursor uses. On "Videowright supports it." the HUD locks onto the claim: the beat's payoff
// is the sentence that was on screen all along.

/**
 * This segment's advances (s). Timing inside a window that must fit it derives from these.
 * Deviation: the architecture plans 4–5 advances here; there are nine, because every sub-beat
 * event ("Three.js", "Lottie", "rendered", "Videowright") must start on its VO word, not a hold.
 */
const ADV = [2.677, 5.424, 7.424, 8.404, 9.495, 11.415, 13.585, 15.365, 17.543];
const CUE = { space: 1, lottie: 3, rendered: 5, send: 6, claim: 7, exit: 8 } as const;

/**
 * The demo viewport, in stage px (right of the rail, inside the safe frame). Deviation from the
 * Direction's "each demo uses the full stage": the claim must hold the frame for the whole
 * beat, so the demos share it with the rail; each fills this viewport.
 */
const VIEW = { x: 660, y: 140, w: 1100, h: 800 } as const;
const STEPS = ["Animated SVG", "ECharts", "Three.js + Lottie", "Product UI"];
const PROBES = [
	"SVG · 5 GEARS · 116 TEETH",
	"ECHARTS 6.1 · CANVAS 2D",
	"THREE.JS R184 · WEBGL 2",
	"ACME APP · REAL DOM",
];
/** The spine: x of its line, y of the first step, the step pitch. */
const SPINE = { x: 172, top: 498, pitch: 104 } as const;

let host: HTMLElement | null = null;
let stage: Stage;
let gears: GearsDemo;
let charts: ChartsDemo;
let space: SpaceDemo;
let app: AppDemo;

const toStage = (b: Box): Box => ({ x: VIEW.x + b.x, y: VIEW.y + b.y, w: b.w, h: b.h });

export default defineSegment({
	id: "v2-web-tech-gallery",
	advances: [2.677, 5.424, 7.424, 8.404, 9.495, 11.415, 13.585, 15.365, 17.543],
	voiceover:
		"That includes animated SVG. Any library, like charting libraries. Advanced 3D and motion, like Three.js or Lottie. Even your real product UI, rendered from your app's codebase. If your stack runs in a browser, Videowright supports it.",
	notes:
		"Entered on me-push. Advances, each 0.15s before its word: 'any' (charts), 'advanced' (3D + Lottie), 'Three.js' (lock the planet), 'Lottie' (lock the rocket, which launches on the word), 'even' (app), 'rendered' (Customers, note), 'If' (send, toast), 'Videowright' (lock the claim), exit before 'Request'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 1180, y: 520 }, scanPhase: 3600 });
		stage.content.innerHTML = `
			<div data-ref="claim" style="position:absolute; left:160px; top:146px; width:440px">
				${["If the browser", "can render it,", "Videowright can", "animate it."]
					.map(
						(line, i) =>
							`<span class="me-line"><span class="v2-claim" style="color:${i < 2 ? "var(--fg-2)" : "var(--color-fg)"}">${line}</span></span>`,
					)
					.join("")}
			</div>
			${STEPS.map(
				(name, i) => `
				<div data-ref="step-${i}" style="position:absolute; left:${SPINE.x + 34}px; top:${SPINE.top + i * SPINE.pitch - 26}px; display:flex; gap:18px; align-items:baseline; white-space:nowrap">
					<span class="me-line"><span class="me-mono" data-ref="num-${i}" style="color:var(--color-muted)">0${i + 1}</span></span>
					<span class="me-line"><span class="me-body" data-ref="name-${i}" style="color:var(--color-muted)">${name}</span></span>
				</div>`,
			).join("")}
			<div data-ref="view" style="position:absolute; left:${VIEW.x}px; top:${VIEW.y}px; width:${VIEW.w}px; height:${VIEW.h}px; overflow:hidden"></div>`;
		const view = stage.ref("view");
		gears = createGears(view);
		charts = createCharts(view);
		space = createSpace(view);
		app = createApp(view);
		for (const demo of [charts, space, app]) demo.layer.style.visibility = "hidden";
		for (const line of stage.content.querySelectorAll(".me-line > span")) {
			(line as HTMLElement).style.transform = "translateY(112%)";
		}
		showHud(el, {
			beat: 3,
			total: 8,
			section: "Web tech",
			probe: PROBES[0],
			// Lands with the push's arrival (it brings the new content in at 40%).
			delay: 280,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const { signal } = ctx;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// ── The rail: the claim rises, the spine draws down, the steps name the technologies ──
		riseIn([...stage.ref("claim").querySelectorAll(".me-line > span")], 40);
		const last = SPINE.top + (STEPS.length - 1) * SPINE.pitch;
		const spine = svg(s, "path", {
			d: `M${SPINE.x} ${SPINE.top - 30} V${last + 30}`,
			stroke: "var(--hairline)",
			"stroke-width": 2,
			fill: "none",
		});
		draw(spine, 200, ms("--dur-draw"));
		const fill = svg(s, "path", {
			d: `M${SPINE.x} ${SPINE.top - 30} V${last + 30}`,
			stroke: "var(--cyan)",
			"stroke-width": 2,
			fill: "none",
		});
		fill.setAttribute("pathLength", "1");
		fill.style.strokeDasharray = "1 2";
		fill.style.strokeDashoffset = "1";
		const nodes = STEPS.map((_, i) =>
			svg(s, "circle", {
				cx: SPINE.x,
				cy: SPINE.top + i * SPINE.pitch,
				r: 9,
				fill: "var(--color-bg)",
				stroke: "var(--color-muted)",
				"stroke-width": 2,
			}),
		);
		nodes.forEach((n, i) => {
			n.style.transformBox = "view-box";
			n.style.transformOrigin = `${SPINE.x}px ${SPINE.top + i * SPINE.pitch}px`;
			n.animate([{ transform: "scale(0)" }, { transform: "none" }], {
				duration: ms("--dur-normal"),
				delay: 320 + i * ms("--stagger"),
				easing: css("--ease-settle"),
				fill: "both",
			});
		});
		STEPS.forEach((_, i) => {
			riseIn(
				[...stage.ref(`step-${i}`).querySelectorAll(".me-line > span")],
				360 + i * ms("--stagger"),
			);
		});
		// One step is current (amber), earlier ones are done (cyan), later ones wait (muted).
		let filled = 0;
		const step = (i: number, delay: number) => {
			const span = (SPINE.pitch * i + 30) / (last - SPINE.top + 60);
			fill.animate([{ strokeDashoffset: 1 - filled }, { strokeDashoffset: 1 - span }], {
				duration: ms("--dur-slow"),
				delay,
				easing: css("--ease-settle"),
				fill: "both",
			});
			filled = span;
			const set = { duration: 1, delay, fill: "both" as const };
			if (i > 0) {
				nodes[i - 1].animate(
					[
						{ fill: "var(--amber)", stroke: "var(--amber)" },
						{ fill: "var(--cyan)", stroke: "var(--cyan)" },
					],
					set,
				);
				stage
					.ref(`num-${i - 1}`)
					.animate([{ color: "var(--amber)" }, { color: "var(--cyan)" }], set);
				stage
					.ref(`name-${i - 1}`)
					.animate([{ color: "var(--color-fg)" }, { color: "var(--fg-2)" }], set);
			}
			const node = nodes[i];
			node.animate(
				[
					{ fill: "var(--color-bg)", stroke: "var(--color-muted)" },
					{ fill: "var(--amber)", stroke: "var(--amber)" },
				],
				set,
			);
			node.animate([{ transform: "scale(1.9)" }, { transform: "none" }], {
				duration: 620,
				delay,
				easing: css("--ease-settle"),
				fill: "both",
			});
			stage
				.ref(`num-${i}`)
				.animate([{ color: "var(--color-muted)" }, { color: "var(--amber)" }], set);
			stage
				.ref(`name-${i}`)
				.animate([{ color: "var(--color-muted)" }, { color: "var(--color-fg)" }], set);
			flare(stage, SPINE.x, SPINE.top + i * SPINE.pitch, delay);
		};
		step(0, 640);

		// ── 01 · Animated SVG (from frame 1, under the push) ──
		gears.play(amb, 60);

		const view = stage.ref("view");
		const region = { x: 0, y: 0, w: VIEW.w, h: VIEW.h };
		// The next demo sweeps in over the last, which stops working once it is covered.
		const swap = (
			from: GearsDemo | ChartsDemo | SpaceDemo,
			to: { layer: HTMLElement },
			i: number,
		) => {
			from.stopAfter(sweepReveal(view, to.layer, from.layer, region));
			step(i, 60);
			hudProbe(PROBES[i], 240, signal);
		};

		await ctx.waitForNext();
		// ── 02 · ECharts ("any library") ──
		swap(gears, charts, 1);
		charts.play(amb, 120);

		await ctx.waitForNext();
		// ── 03 · Three.js + Lottie ("advanced 3D and motion") ──
		swap(charts, space, 2);
		// The rocket leaves the pad mid-word on "Lottie": the Lottie starts LAUNCH_FRAME frames
		// (25 fps) before that moment (0.15s after the cue, plus ~0.15s), so the lock lands on the
		// rocket still on the pad and the launch reads under the word.
		const lottieAt = (ADV[CUE.lottie] + 0.3 - ADV[CUE.space]) * 1000 - (LAUNCH_FRAME / 25) * 1000;
		space.play(amb, 0, lottieAt);

		await ctx.waitForNext();
		// "Three.js": the HUD locks onto the planet and names it.
		const planet = toStage(space.planetBox);
		const planetLock = registerOn(s, planet, 0, 0);
		const planetTag = tag(s, planet, "THREE.JS · WEBGL", 260);
		flare(stage, planet.x + planet.w / 2, planet.y + planet.h / 2, 300);

		await ctx.waitForNext();
		// "Lottie": the lock hands over to the rocket's card; the planet's marks go cyan.
		const handOff = { duration: ms("--dur-fast"), fill: "forwards" as const };
		for (const c of planetLock)
			c.animate([{ stroke: "var(--amber)" }, { stroke: "var(--cyan)", opacity: 0.5 }], handOff);
		planetTag.animate([{ opacity: 1 }, { opacity: 0.5 }], handOff);
		const card = toStage(space.cardBox);
		const cardLock = registerOn(s, card, 0, 12);
		const cardTag = tag(s, card, "LOTTIE · AFTER EFFECTS JSON", 260, "end");
		hudProbe("LOTTIE 5.13 · SVG PLAYER", 200, signal);

		await ctx.waitForNext();
		// ── 04 · Product UI ("even your real product UI") ──
		const marks = [...planetLock, ...cardLock, planetTag, cardTag];
		for (const m of marks)
			m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms("--dur-fast"), fill: "forwards" });
		swap(space, app, 3);
		app.dashboard(amb, 200);

		await ctx.waitForNext();
		// "rendered from your app's codebase": the app is used. Customers, a row, a note.
		app.customers(amb, (ADV[CUE.send] - ADV[CUE.rendered]) * 1000);
		hudProbe("ROUTE /CUSTOMERS", 160, signal);

		await ctx.waitForNext();
		// "If your stack runs in a browser": send; the toast confirms; the camera rests.
		app.send();
		hudProbe("POST /NOTES · 201 CREATED", 400, signal);

		await ctx.waitForNext();
		// "Videowright supports it.": the payoff is the claim. All four steps are done (cyan),
		// and the HUD locks onto the sentence that held the frame all beat.
		app.idle();
		// The claim takes focus: the demo viewport steps back while the HUD locks onto it.
		view.animate([{ filter: "brightness(1)" }, { filter: "brightness(0.55)" }], {
			duration: ms("--dur-slow"),
			delay: 120,
			easing: css("--ease-settle"),
			fill: "forwards",
		});
		const done = { duration: 1, fill: "both" as const };
		nodes[3].animate(
			[
				{ fill: "var(--amber)", stroke: "var(--amber)" },
				{ fill: "var(--cyan)", stroke: "var(--cyan)" },
			],
			done,
		);
		stage.ref("num-3").animate([{ color: "var(--amber)" }, { color: "var(--cyan)" }], done);
		fill.animate([{ strokeDashoffset: 1 - filled }, { strokeDashoffset: 0 }], {
			duration: ms("--dur-slow"),
			easing: css("--ease-settle"),
			fill: "both",
		});
		const claim = boxOf(stage.ref("claim"));
		const claimLock = registerOn(s, claim, 0, 16);
		flare(stage, claim.x + claim.w / 2, claim.y + claim.h / 2, 300);
		for (const line of [...stage.ref("claim").querySelectorAll(".v2-claim")].slice(2)) {
			line.animate([{ color: "var(--color-fg)" }, { color: "var(--amber)" }], {
				duration: ms("--dur-normal"),
				delay: 120,
				fill: "both",
			});
		}
		hudProbe("SUPPORTED · 4 / 4 STACKS", 300, signal);

		// Release before the exit: the corners let go and the camera rests, so the grid meets
		// the next scene's at identity under the split.
		const out = ms("--dur-exit");
		await ctx.hold(Math.max(0, (ADV[CUE.exit] - ADV[CUE.claim]) * 1000 - out * 1.6));
		release([], claimLock);
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		// Loops stop with ctx.signal; the GPU and canvas demos are freed once the slot is
		// cleared, so the transition out keeps the last frame.
		charts.dispose();
		space.dispose();
		host = null;
	},
});

/** A cyan readout under a locked box, rising into place `delay` ms from now. */
function tag(
	parent: SVGSVGElement,
	box: Box,
	text: string,
	delay: number,
	anchor: "start" | "end" = "start",
): SVGTextElement {
	const t = svg(parent, "text", {
		x: anchor === "start" ? box.x : box.x + box.w,
		"text-anchor": anchor,
		y: box.y + box.h + 50,
		fill: "var(--cyan)",
		class: "me-readout",
		style: "font-size: var(--type-mono)",
	});
	t.textContent = text;
	t.animate(
		[
			{ opacity: 0, transform: "translateY(12px)" },
			{ opacity: 1, transform: "none" },
		],
		{ duration: ms("--dur-normal"), delay, easing: css("--ease-settle"), fill: "both" },
	);
	return t;
}
