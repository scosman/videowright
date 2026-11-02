import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { showHud } from "../../components/v2/hud.js";
import {
	AGENTS_SCAN_PHASE,
	END_CARD_BOX,
	END_CARD_KEY,
	keyAt,
	matchOutline,
} from "../../components/v2/match.js";
import { css, ms, riseIn, riseOut } from "../../components/v2/motion.js";
import { type Stage, createStage, panelIn, startAmbient } from "../../components/v2/stage.js";
import claudeIcon from "./icons/claude.svg?raw";
import codexIcon from "./icons/codex.svg?raw";
import opencodeIcon from "./icons/opencode.svg?raw";

// Beat 7: "works in every major coding agent". The claim rises from frame 1; on "every" the
// three targets arrive one after another, each with its real logo and name: the panel
// measures itself in, the logo's outline draws and fills, the name rises. It reads in ~4s.
// The release is the video's one match cut: the content rises out of its masks, one outline
// draws around the three targets and travels onto the end card's prompt box, landing on the
// cut: any agent → your agent's input box.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [1.367, 5.033];
const CUE = { arrive: 0, exit: 1 } as const;
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;

/** The real logos (copied byte for byte), each in its own colour: Claude's mark is orange. */
const AGENTS = [
	{ name: "Claude Code", icon: claudeIcon, color: "#d97757" },
	{ name: "Codex", icon: codexIcon, color: "#f4f6fc" },
	{ name: "opencode", icon: opencodeIcon, color: "#f4f6fc" },
];
/**
 * Three cells on the grid's own lines (480 wide, 80 gutters, x 160–1760), sized to their
 * content (the logo, the name), the claim and the cells centred on the frame as a group.
 */
const PANEL = { x: 160, y: 405, w: 480, h: 450, pitch: 560 } as const;
const CLAIM_TOP = 225;
const LOGO = 200;
/** The three targets' union: where the matched outline starts. */
const UNION = { x: PANEL.x, y: PANEL.y, w: 2 * PANEL.pitch + PANEL.w, h: PANEL.h };
/**
 * The match cut, ending on the exit (ms): the content rises out and the panels retract over
 * `exit`; the outline draws around the targets until `morphAt` (the content still half there),
 * then travels to the end card's box over `morph`, on an in-out ease, so it is still moving
 * into the cut rather than resting on an empty frame.
 */
const MATCH = { exit: 420, morphAt: 190, morph: 490 } as const;

let host: HTMLElement | null = null;
let stage: Stage;
let panels: HTMLElement[];

export default defineSegment({
	id: "v2-any-coding-agent",
	advances: [1.367, 5.033],
	voiceover: "And Videowright works in every major coding agent.",
	notes:
		"Entered on me-sweep. The claim rises from frame 1 ('And Videowright works in'). Advance 1: 0.15s before 'every', the three targets arrive one after another. Advance 2: exit, 0.15s before 'Install', on the match cut into the end card.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 960, y: 560 }, scanPhase: AGENTS_SCAN_PHASE });
		stage.setOrigin(960, 540);
		stage.content.innerHTML = `
			<div class="me-h1" style="position:absolute; left:160px; top:${CLAIM_TOP}px; white-space:nowrap">
				<span class="me-line"><span data-ref="claim">Works in any coding agent.</span></span>
			</div>
			${AGENTS.map(
				(agent, i) => `
				<div class="me-panel" data-ref="panel-${i}" style="position:absolute; left:${PANEL.x + i * PANEL.pitch}px; top:${PANEL.y}px; width:${PANEL.w}px; height:${PANEL.h}px; visibility:hidden">
					<div style="position:absolute; left:${(PANEL.w - LOGO) / 2}px; top:64px; width:${LOGO}px; height:${LOGO}px; overflow:hidden">
						<div data-ref="logo-${i}" style="width:${LOGO}px; height:${LOGO}px; color:${agent.color}">${agent.icon}</div>
					</div>
					<div style="position:absolute; left:0; right:0; top:306px; text-align:center">
						<span class="me-line"><span data-ref="name-${i}" style="font-family:var(--font-display); font-size:64px; font-weight:600; letter-spacing:-0.01em; color:var(--color-fg)">${agent.name}</span></span>
					</div>
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
			// The sweep's beam passes the HUD's left slots early in its run.
			delay: 140,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);

		// ── The claim rises from frame 1, under the sweep ("And Videowright works in…") ──
		riseIn([stage.ref("claim")], 40);

		await ctx.waitForNext();
		// ── "every major coding agent": the three targets arrive, one after another ──
		const w = span(CUE.exit);
		const releaseFor = MATCH.morphAt + MATCH.morph;
		// Paced to the style's tempo, compressed if a re-timed take shortens the window.
		const pace = Math.min(1, (w - releaseFor) / 1700);
		const at = (msAt: number) => msAt * pace;
		panels.forEach((panel, i) => {
			const start = at(i * 200);
			panel.animate([{ visibility: "hidden" }, { visibility: "visible" }], {
				duration: 1,
				delay: start,
				fill: "both",
			});
			// The surface fills with its outline, so the top edge never draws alone under the claim.
			panelIn(stage, panel, start, ms("--dur-draw") * 0.8 * pace, 0);
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
					delay: start + at(180),
					easing: css("--ease-draw"),
					fill: "both",
				});
				path.animate(
					[
						{ fillOpacity: 0, strokeOpacity: 1 },
						{ fillOpacity: 1, strokeOpacity: 0 },
					],
					{ duration: 360 * pace, delay: start + at(640), easing: "linear", fill: "both" },
				);
			}
			riseIn([stage.ref(`name-${i}`)], start + at(360), ms("--dur-slow") * pace);
		});

		// ── Release into the match cut (the window's last releaseFor ms) ──
		await ctx.hold(Math.max(0, w - releaseFor));
		amb.rest(releaseFor * 0.9);
		const draw = css("--ease-draw");
		// The content rises out of its masks: the claim, then each target's logo and name.
		riseOut([stage.ref("claim")], 0, MATCH.exit, 0, draw);
		AGENTS.forEach((_, i) => {
			const parts = ["logo", "name"].map((ref) => stage.ref(`${ref}-${i}`));
			riseOut(parts, i * 30, MATCH.exit, 0, draw);
		});
		// One outline draws around the three targets as their surfaces hand over to it
		// (retracting upward, panelIn reversed)...
		const outline = matchOutline(stage.content, UNION);
		outline.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
			duration: MATCH.morphAt,
			easing: draw,
			fill: "both",
		});
		for (const panel of panels) {
			panel.animate(
				[{ clipPath: "inset(-160px)" }, { clipPath: "inset(-160px -160px 100% -160px)" }],
				{ duration: MATCH.exit, easing: draw, fill: "forwards" },
			);
		}
		// ...and travels onto the end card's prompt box, landing on the exit frame, while the key
		// light glides to the end card's.
		const box = END_CARD_BOX;
		outline.animate(
			[
				{
					left: `${UNION.x}px`,
					top: `${UNION.y}px`,
					width: `${UNION.w}px`,
					height: `${UNION.h}px`,
				},
				{ left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` },
			],
			{ duration: MATCH.morph, delay: MATCH.morphAt, easing: draw, fill: "forwards" },
		);
		const key = stage.root.querySelector(".me-key") as HTMLElement;
		key.animate([{ backgroundPosition: keyAt(END_CARD_KEY) }], {
			duration: releaseFor,
			easing: css("--ease-sweep"),
			fill: "forwards",
		});
		await ctx.hold(releaseFor);
	},

	unmount() {
		host = null;
	},
});
