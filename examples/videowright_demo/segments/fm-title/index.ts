import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { riseOut } from "../../components/v2/motion.js";
import { type Stage, createStage, startAmbient } from "../../components/v2/stage.js";
import cues from "../../videos/2026_11_five_months/audio/cues.json";

// The title card, and the video's thumbnail: one title, whole on frame 1, nothing else. A huge
// "5 months" (the hook, legible at thumbnail size) over "of progress in Claude video
// generation". The plane breathes under it while the narration sets it up; on the release cue
// the title rises out of its masks, and the first pair builds the comparison rig in.

let stage: Stage;
let lines: HTMLElement[] = [];

export default defineSegment({
	id: "fm-title",
	advances: cues.segments["fm-title"].advances,
	voiceover:
		"We generated the same video with Claude, five months apart. The difference is staggering.",
	notes:
		"Advance 1: the release, 12 frames after 'staggering.'. Advance 2: exit (hard cut), 0.15s before the first pair's 'In'.",

	async mount(el) {
		await fontsReady();
		stage = createStage(el, { key: { x: 960, y: 470 } });
		const block = document.createElement("div");
		block.style.cssText =
			"position:absolute; left:0; right:0; top:316px; z-index:5; text-align:center";
		// Each line in a mask with room for its descenders (in px of its own size: an em here would
		// resolve against the wrapper), so a rise never clips the g or the p.
		const masked = (size: number, inner: string) =>
			`<div style="overflow:hidden; padding-bottom:${Math.round(size * 0.28)}px; margin-bottom:${-Math.round(size * 0.28)}px">${inner}</div>`;
		block.innerHTML = `
			${masked(300, `<div class="me-display" data-line style="font-size:300px; line-height:0.94; color:var(--color-fg)">5 months</div>`)}
			<div style="height:44px"></div>
			${masked(76, `<div class="me-h2" data-line style="font-size:76px; color:var(--fg-2)">of progress in <span style="color:var(--color-fg)">Claude</span> video generation</div>`)}`;
		stage.content.appendChild(block);
		lines = Array.from(block.querySelectorAll("[data-line]")) as HTMLElement[];
	},

	async play(ctx) {
		startAmbient(ctx, stage, { driftMs: 9000, push: 0.03 });
		await ctx.waitForNext();
		riseOut(lines, 0);
		await ctx.waitForNext();
	},
});
