import { defineSegment } from "videowright";
import { createRig } from "../../components/fm/rig.js";
import type { Rig } from "../../components/fm/rig.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { createTicker, css, drawEase, ms, riseOut } from "../../components/v2/motion.js";
import { createStage } from "../../components/v2/stage.js";

// The title card, and the video's thumbnail: the headline is on screen, whole, from frame 1.
// It also teaches the comparison rig before any footage: the THEN / NOW rail sits where it
// will stay for every pair, its ruler is May to November, and its cyan fill measures the
// 171 days between the two videos. The claim lights phrase by phrase with the narration
// ("Same script." "Same brief.", then "New model." on "Claude"). On the morph cue the title
// clears, the dates and the dimension fade, the fill retracts and NOW dims (the rail at
// rest, on THEN) and the footage window comes up, empty: the hard cut into the first pair
// fills it.

const DAYS = 171;

let rig: Rig;
let block: HTMLElement;
let phrases: HTMLElement[] = [];
let dates: HTMLElement;
let days: HTMLElement;

export default defineSegment({
	id: "fm-title",
	advances: [0.533, 1.633, 2.783, 6.3, 7.25],
	voiceover: "Same script. Same brief. Claude made our demo video in May, and again last week.",
	notes:
		"Advances 1-3: the claim's phrases light, 0.15s before 'Same' (script), 'same' (brief) and 'Claude'. Advance 4: the morph into the rig at rest, after 'week.'. Advance 5: exit (hard cut), 0.15s before the first pair's 'In'.",

	async mount(el) {
		await fontsReady();
		createStage(el, { key: { x: 960, y: 420 } });
		block = document.createElement("div");
		block.style.cssText =
			"position:absolute; left:0; right:0; top:236px; z-index:5; text-align:center";
		block.innerHTML = `
			<div style="overflow:hidden; padding-bottom:0.12em"><div class="me-display-sm" style="color:var(--color-fg)">5 months of progress</div></div>
			<div style="overflow:hidden; margin-top:36px"><div class="me-h2" style="color:var(--fg-2)">in Claude video generation</div></div>
			<div style="margin-top:92px; font-family:var(--font-body); font-size:58px; font-weight:500; word-spacing:0.18em">
				<span data-phrase>Same script.</span> <span data-phrase>Same brief.</span> <span data-phrase data-new>New model.</span>
			</div>`;
		el.appendChild(block);
		phrases = Array.from(block.querySelectorAll("[data-phrase]")) as HTMLElement[];
		for (const p of phrases) p.style.color = "rgba(230, 245, 250, 0.3)";

		rig = createRig(el, { captions: ["", ""] });
		rig.window.style.opacity = "0";
		rig.parts.labelNow.toggleAttribute("data-lit", true);
		// The dates under the rail's ends and the dimension between them, in the caption row.
		const row = rig.parts.caption;
		dates = document.createElement("div");
		dates.style.cssText =
			"position:absolute; inset:0; display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:40px; font-weight:500; letter-spacing:0.06em; color:var(--fg-2)";
		dates.innerHTML = "<span>MAY 15 2026</span><span>NOV 2 2026</span>";
		days = document.createElement("div");
		days.style.cssText =
			"position:absolute; left:0; right:0; top:-6px; text-align:center; font-family:var(--font-mono); font-size:52px; font-weight:600; letter-spacing:0.08em; color:var(--cyan); text-shadow:var(--glow-cyan); opacity:0";
		days.textContent = "0 DAYS";
		row.append(dates, days);
	},

	async play(ctx) {
		const ticker = createTicker(() => ctx.clock(), ctx.signal);
		// The fill measures the 171 days, and the dimension counts them, from frame 1.
		const fillFrom = 150;
		const fillFor = 1500;
		rig.parts.fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			duration: fillFor,
			delay: fillFrom,
			easing: css("--ease-draw"),
			fill: "both",
		});
		days.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 300,
			delay: fillFrom,
			fill: "both",
		});
		ticker.add((t) => {
			const p = drawEase(Math.min(Math.max((t - fillFrom) / fillFor, 0), 1));
			days.textContent = `${Math.round(p * DAYS)} DAYS`;
			return p < 1;
		});

		const light = (p: HTMLElement) =>
			p.animate(
				[
					{ color: "rgba(230, 245, 250, 0.3)" },
					{ color: p.hasAttribute("data-new") ? css("--amber") : css("--color-fg") },
				],
				{ duration: ms("--dur-normal"), easing: css("--ease-settle"), fill: "forwards" },
			);
		for (const p of phrases) {
			await ctx.waitForNext();
			light(p);
		}

		// The morph: the rail comes to rest on THEN and the window comes up.
		await ctx.waitForNext();
		riseOut(Array.from(block.querySelectorAll(".me-display-sm, .me-h2")), 0);
		const fade = { duration: 420, easing: css("--ease-exit"), fill: "forwards" as const };
		block.lastElementChild?.animate([{ opacity: 1 }, { opacity: 0 }], fade);
		dates.animate([{ opacity: 1 }, { opacity: 0 }], fade);
		days.animate([{ opacity: 1 }, { opacity: 0 }], fade);
		rig.parts.fill.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], {
			duration: 600,
			delay: 120,
			easing: css("--ease-sweep"),
			fill: "forwards",
		});
		rig.parts.labelNow.animate([{ opacity: 1 }, { opacity: 0.26 }], {
			duration: 400,
			delay: 200,
			fill: "forwards",
		});
		rig.window.animate(
			[
				{ opacity: 0, transform: "scale(0.985)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: 600, delay: 260, easing: css("--ease-settle"), fill: "forwards" },
		);
		await ctx.waitForNext();
	},
});
