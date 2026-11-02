import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { showHud } from "../../components/v2/hud.js";
import { css, draw, ms, riseIn, svg } from "../../components/v2/motion.js";
import { type Stage, createStage, flare, startAmbient } from "../../components/v2/stage.js";
import { sweepReveal } from "../../components/v2/sweep.js";
import { type AppDemo, createApp } from "./app.js";
import { type ChartsDemo, createCharts } from "./charts.js";
import { type GearsDemo, createGears } from "./gears.js";
import { LAUNCH_FRAME, type SpaceDemo, createSpace } from "./space.js";

// Beat 3: "any web technologies", shown working. A 4-step spine on the left names each
// technology as it plays; the demo viewport on the right swaps on each VO cue under the
// style's signature sweep: a self-drawing SVG gear train, real ECharts, a real Three.js scene
// beside the real Lottie rocket, and a real product UI that a cursor uses. On "Videowright
// supports it." the note is sent, the toast confirms and the spine completes: four for four.

/**
 * This segment's advances (s). Timing inside a window that must fit it derives from these.
 * Deviation: the architecture plans 4–5 advances here; there are seven, because the Lottie's
 * launch, the app's route change and its send are each cued on their VO word, not a hold.
 */
const ADV = [2.683, 5.417, 8.4, 9.5, 11.417, 15.367, 18.15];
/** "advanced" (3D + Lottie), "Lottie" (the launch is timed to it), "rendered", "Videowright". */
const CUE = { space: 1, lottie: 2, rendered: 4, send: 5, exit: 6 } as const;

/**
 * The demo viewport, in stage px (right of the rail, inside the safe frame). Deviation from the
 * Direction's "each demo uses the full stage": the spine names each demo beside it; each demo
 * fills this viewport.
 */
const VIEW = { x: 660, y: 140, w: 1100, h: 800 } as const;
const STEPS = ["Animated SVG", "ECharts", "Three.js + Lottie", "Product UI"];
/** The spine: x of its line, y of the first step, the step pitch. Centred on the frame. */
const SPINE = { x: 172, top: 384, pitch: 104 } as const;

let host: HTMLElement | null = null;
let stage: Stage;
let gears: GearsDemo;
let charts: ChartsDemo;
let space: SpaceDemo;
let app: AppDemo;

export default defineSegment({
	id: "v2-web-tech-gallery",
	advances: [2.683, 5.417, 8.4, 9.5, 11.417, 15.367, 18.15],
	voiceover:
		"That includes animated SVG. Any library, like charting libraries. Advanced 3D and motion, like Three.js or Lottie. Even your real product UI, rendered from your app's codebase. If your stack runs in a browser, Videowright supports it.",
	notes:
		"Entered on me-push. Advances, each 0.15s before its word: 'any' (charts), 'advanced' (3D + Lottie), 'Lottie' (the rocket launches on the word), 'even' (app), 'rendered' (Customers, the note), 'Videowright' (send, the toast, the spine completes), exit before 'Request'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 1180, y: 520 }, scanPhase: 3600 });
		stage.content.innerHTML = `
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
		// The GPU and canvas demos are freed once this mount's slot is cleared (so the transition
		// out keeps the last frame). Tied to this mount's own signal, not the module's latest
		// instances: a same-segment jump mounts the new copy before the old one unmounts.
		const own = { charts, space };
		ctx.signal.addEventListener(
			"abort",
			() => {
				own.charts.dispose();
				own.space.dispose();
			},
			{ once: true },
		);
		for (const demo of [charts, space, app]) demo.layer.style.visibility = "hidden";
		for (const line of stage.content.querySelectorAll(".me-line > span")) {
			(line as HTMLElement).style.transform = "translateY(112%)";
		}
		showHud(el, {
			beat: 3,
			total: 8,
			section: "Web tech",
			// Lands with the push's arrival (it brings the new content in at 40%).
			delay: 280,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// ── The rail: the spine draws down, the steps name the technologies ──
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
		};

		await ctx.waitForNext();
		// ── 02 · ECharts ("any library") ──
		swap(gears, charts, 1);
		charts.play(amb, 120);

		await ctx.waitForNext();
		// ── 03 · Three.js + Lottie ("advanced 3D and motion") ──
		swap(charts, space, 2);
		// The rocket leaves the pad mid-word on "Lottie": the Lottie starts LAUNCH_FRAME frames
		// (25 fps) before that moment (0.15s after the cue, plus ~0.15s), so the launch reads
		// under the word.
		const lottieAt = (ADV[CUE.lottie] + 0.3 - ADV[CUE.space]) * 1000 - (LAUNCH_FRAME / 25) * 1000;
		space.play(amb, 0, lottieAt);

		await ctx.waitForNext();
		// "Lottie": the rocket leaves the pad mid-word (its start was timed to this cue above).

		await ctx.waitForNext();
		// ── 04 · Product UI ("even your real product UI") ──
		swap(space, app, 3);
		app.dashboard(amb, 200);

		await ctx.waitForNext();
		// "rendered from your app's codebase": the app is used. Customers, a row, a note, paced
		// to the window up to "Videowright".
		app.customers(amb, (ADV[CUE.send] - ADV[CUE.rendered]) * 1000);

		await ctx.waitForNext();
		// "Videowright supports it.": the note is sent and the toast confirms; the last step is
		// done, so the spine completes, four for four.
		app.send();
		app.idle(900);
		const done = { duration: 1, fill: "both" as const };
		nodes[3].animate(
			[
				{ fill: "var(--amber)", stroke: "var(--amber)" },
				{ fill: "var(--cyan)", stroke: "var(--cyan)" },
			],
			done,
		);
		stage.ref("num-3").animate([{ color: "var(--amber)" }, { color: "var(--cyan)" }], done);
		stage.ref("name-3").animate([{ color: "var(--color-fg)" }, { color: "var(--fg-2)" }], done);
		fill.animate([{ strokeDashoffset: 1 - filled }, { strokeDashoffset: 0 }], {
			duration: ms("--dur-slow"),
			easing: css("--ease-settle"),
			fill: "both",
		});

		// Release before the exit: the camera rests, so the grid meets the next scene's at
		// identity under the split.
		const out = ms("--dur-exit");
		await ctx.hold(Math.max(0, (ADV[CUE.exit] - ADV[CUE.send]) * 1000 - out * 1.4));
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		// Loops stop with ctx.signal, which also queues the GPU and canvas demos' disposal
		// (mount()).
		host = null;
	},
});
