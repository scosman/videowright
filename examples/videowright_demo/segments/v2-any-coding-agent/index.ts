import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { decode, hudProbe, registerOn, release, showHud } from "../../components/v2/hud.js";
import { css, ms, riseIn } from "../../components/v2/motion.js";
import {
	type Stage,
	boxOf,
	createStage,
	flare,
	panelIn,
	startAmbient,
} from "../../components/v2/stage.js";
import claudeIcon from "./icons/claude.svg?raw";
import codexIcon from "./icons/codex.svg?raw";
import opencodeIcon from "./icons/opencode.svg?raw";

// Beat 7: "works in every major coding agent". Three bold targets on the grid, one per agent,
// each with its real logo and name. They measure themselves in under the sweep: the panels
// draw, the logos' outlines draw and fill, the names rise. On "every" the HUD's lock hops
// from agent to agent and each one reads SUPPORTED ✓ as the lock lands. It reads in ~4s.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [1.36, 3.737];
const CUE = { check: 0, exit: 1 } as const;
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;

/** The real logos (copied byte for byte), each in its own colour: Claude's mark is orange. */
const AGENTS = [
	{ name: "Claude Code", icon: claudeIcon, color: "#d97757", probe: "CLAUDE CODE · SKILL" },
	{ name: "Codex", icon: codexIcon, color: "#f4f6fc", probe: "CODEX · AGENTS SKILL" },
	{ name: "opencode", icon: opencodeIcon, color: "#f4f6fc", probe: "OPENCODE · AGENTS SKILL" },
];
/** Three cells on the grid's own lines: 480 wide, 80 gutters, x 160–1760. */
const PANEL = { x: 160, y: 330, w: 480, h: 520, pitch: 560 } as const;
const LOGO = 200;

let host: HTMLElement | null = null;
let stage: Stage;
let panels: HTMLElement[];

export default defineSegment({
	id: "v2-any-coding-agent",
	advances: [1.36, 3.737],
	voiceover: "And Videowright works in every major coding agent.",
	notes:
		"Entered on me-sweep. The targets measure themselves in from frame 1 ('And Videowright works in'). Advance 1: 0.15s before 'every', the lock hops across the three and each reads SUPPORTED. Advance 2: exit, 0.15s before 'Install'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 960, y: 560 }, scanPhase: 900 });
		stage.setOrigin(960, 560);
		stage.content.innerHTML = `
			<div class="me-h1" style="position:absolute; left:160px; top:150px; white-space:nowrap">
				<span class="me-line"><span data-ref="claim">Works in any coding agent.</span></span>
			</div>
			${AGENTS.map(
				(agent, i) => `
				<div class="me-panel" data-ref="panel-${i}" style="position:absolute; left:${PANEL.x + i * PANEL.pitch}px; top:${PANEL.y}px; width:${PANEL.w}px; height:${PANEL.h}px">
					<div data-ref="logo-${i}" style="position:absolute; left:${(PANEL.w - LOGO) / 2}px; top:64px; width:${LOGO}px; height:${LOGO}px; color:${agent.color}">${agent.icon}</div>
					<div style="position:absolute; left:0; right:0; top:306px; text-align:center">
						<span class="me-line"><span data-ref="name-${i}" style="font-family:var(--font-display); font-size:64px; font-weight:600; letter-spacing:-0.01em; color:var(--color-fg)">${agent.name}</span></span>
					</div>
					<div style="position:absolute; left:40px; right:40px; top:416px; height:1px; background:var(--color-border)"></div>
					<div class="me-mono" data-ref="status-${i}" style="position:absolute; left:0; right:0; top:440px; text-align:center; color:var(--ok); font-weight:560; white-space:pre"></div>
				</div>`,
			).join("")}`;
		panels = AGENTS.map((_, i) => stage.ref(`panel-${i}`));
		for (const ref of ["claim", ...AGENTS.map((_, i) => `name-${i}`)]) {
			stage.ref(ref).style.transform = "translateY(112%)";
		}
		// Each logo fills its box; its paths start as undrawn outlines.
		AGENTS.forEach((_, i) => {
			const logo = stage.ref(`logo-${i}`).querySelector("svg") as SVGSVGElement;
			logo.setAttribute("width", String(LOGO));
			logo.setAttribute("height", String(LOGO));
			for (const path of logo.querySelectorAll("path")) {
				if (path.closest("mask")) continue;
				path.setAttribute("pathLength", "1");
				path.style.strokeDasharray = "1 2";
				path.style.strokeDashoffset = "1";
				path.style.fillOpacity = "0";
			}
		});
		showHud(el, {
			beat: 7,
			total: 8,
			section: "Agents",
			probe: "3 AGENTS · ONE SKILL",
			// The sweep's beam passes the HUD's left slots early in its run.
			delay: 140,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const { signal } = ctx;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// ── draw → fill (from frame 1, under the sweep, left to right) ──
		// The entrance fits the first window: it is paced to the style's tempo, compressed if a
		// re-timed take shortens the window.
		const pace = Math.min(1, span(CUE.check) / 1360);
		const at = (msAt: number) => msAt * pace;
		riseIn([stage.ref("claim")], at(40), ms("--dur-slow") * pace);
		panels.forEach((panel, i) => {
			panelIn(stage, panel, at(60 + i * 90), ms("--dur-draw") * 0.8 * pace);
			const logo = stage.ref(`logo-${i}`).querySelector("svg") as SVGSVGElement;
			// The outline draws (its strokes scale with the logo's viewBox: ~2px on screen), then
			// the fill comes up under it.
			const view = logo.viewBox.baseVal;
			const viewW = Math.max(view.width, view.height) || LOGO;
			for (const path of logo.querySelectorAll("path")) {
				if (path.closest("mask")) continue;
				path.style.stroke = "currentColor";
				path.style.strokeWidth = String((2 * viewW) / LOGO);
				path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
					duration: 620 * pace,
					delay: at(240 + i * 90),
					easing: css("--ease-draw"),
					fill: "both",
				});
				path.animate(
					[
						{ fillOpacity: 0, strokeOpacity: 1 },
						{ fillOpacity: 1, strokeOpacity: 0 },
					],
					{ duration: 360 * pace, delay: at(700 + i * 90), easing: "linear", fill: "both" },
				);
			}
			riseIn([stage.ref(`name-${i}`)], at(420 + i * 90), ms("--dur-slow") * pace);
		});

		await ctx.waitForNext();
		// ── "every major coding agent": the lock hops target to target; each reads SUPPORTED ──
		const w = span(CUE.exit);
		const now = amb.now();
		let previous: SVGPathElement[] = [];
		const locks: SVGPathElement[] = [];
		panels.forEach((panel, i) => {
			const lockAt = w * (0.06 + 0.15 * i);
			const box = boxOf(panel);
			const corners = registerOn(s, box, lockAt, 14);
			flare(stage, box.x + box.w / 2, box.y + box.h / 2, lockAt + 260);
			decode(amb, stage.ref(`status-${i}`), "SUPPORTED ✓", now + lockAt + 220, { signal });
			hudProbe(AGENTS[i].probe, lockAt + 120, signal);
			// One subject at a time: the last target's lock goes cyan as the next one lands.
			for (const c of previous) {
				c.animate([{ stroke: "var(--amber)" }, { stroke: "var(--cyan)", opacity: 0.45 }], {
					duration: ms("--dur-fast"),
					delay: lockAt,
					fill: "forwards",
				});
			}
			previous = corners;
			locks.push(...corners);
		});
		hudProbe("SUPPORTED · 3 / 3 AGENTS", w * 0.5, signal);

		// Release before the exit: the locks let go, the camera rests.
		const out = ms("--dur-exit");
		await ctx.hold(Math.max(0, w - out * 1.6));
		// The earlier locks are already cyan at 45%: they fade from there, with the last one.
		const earlier = locks.filter((c) => !previous.includes(c));
		for (const c of earlier) {
			c.animate([{ opacity: 0.45 }, { opacity: 0 }], {
				duration: out * 0.6,
				easing: css("--ease-exit"),
				fill: "forwards",
			});
		}
		release([], previous);
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		host = null;
	},
});
