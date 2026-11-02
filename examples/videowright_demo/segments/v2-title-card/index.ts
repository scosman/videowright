import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { showHud } from "../../components/v2/hud.js";
import { css, ms } from "../../components/v2/motion.js";
import { type Stage, createStage, flare, startAmbient } from "../../components/v2/stage.js";
import { type TitleLockup, createTitleLockup } from "../../components/v2/title-lockup.js";

// Beat 2: the hard cut lands here, the first frame of the instrument world: the grid and the
// HUD chrome are up on frame 1 and the mark's first stroke is already moving. The mark
// draws, the wordmark rises onto the VO's "Videowright", the tagline onto "video team", and
// then the frame holds and breathes: the video's hero frame. No annotations: the logo is the
// subject. The release rests the camera; the lockup stays for the transition to carry out.

/** This segment's advances (s): the release's rest fits the window to the exit. */
const ADV = [0.467, 2.583, 5.45, 5.967];

let host: HTMLElement | null = null;
let stage: Stage;
let lockup: TitleLockup;

/** Peak alpha of the cut's bloom: measured to lift the plane around the mark ~40 luma. */
const BLOOM_ALPHA = 0.7;

// A one-shot light: a cyan pool around (x, y) on the plane, screen-blended, at full strength on
// its first frame and gone in 500ms. Its falloff is eased (stops at 30% and 65%), so the pool
// has no hard rim. Removed when done, so nothing blends after it.
function bloom(on: Stage, x: number, y: number): void {
	const cyan = (a: number) => `rgba(91, 216, 245, ${(BLOOM_ALPHA * a).toFixed(3)})`;
	const layer = document.createElement("div");
	layer.style.cssText = `position:absolute; inset:0; z-index:var(--z-key); pointer-events:none; mix-blend-mode:screen; background:radial-gradient(circle 560px at ${x}px ${y}px, ${cyan(1)} 0%, ${cyan(0.55)} 30%, ${cyan(0.18)} 65%, transparent 100%)`;
	on.root.querySelector(".me-key")?.after(layer);
	layer
		.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 500,
			easing: css("--ease-settle"),
			fill: "forwards",
		})
		.finished.then(
			() => layer.remove(),
			() => layer.remove(),
		);
}

export default defineSegment({
	id: "v2-title-card",
	advances: [0.467, 2.583, 5.45, 5.967],
	voiceover: "Videowright turns a coding agent into a video team, using any web technologies.",
	notes:
		"Entered on a hard cut (timeline transition: 'cut'). Advance 1: the wordmark, 0.15s before 'Videowright'. Advance 2: the tagline, 0.15s before 'video' ('video team'). Advance 3: release, after 'technologies.'. Advance 4: exit, 0.15s before the gallery's 'That'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 940, y: 510 }, scanPhase: 1800 });
		stage.setOrigin(960, 510);
		lockup = createTitleLockup(stage.content);
		// The HUD comes online with the cut: whole, no entrance, its clock starting here (also on
		// a dev restart or Prev, so the preview matches the render).
		showHud(el, {
			beat: 2,
			total: 8,
			section: "Title",
			restart: true,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		// The hero hold is seconds long: a quicker drift and a stronger push (~3.5%) so it reads.
		const amb = startAmbient(ctx, stage, { driftMs: 7000, push: 0.035 });
		// From frame 1: the strokes draw. The cut is a light event: a cyan bloom around the mark
		// (screen-blended over the plane, under the mark) and the grid's crosses flash on its first
		// frame and fall away within ~0.3s, as the instrument comes on.
		lockup.revealMark();
		const v = lockup.vertex;
		flare(stage, v.x, v.y - 120, 0, 0, 500);
		bloom(stage, v.x, v.y - 120);

		await ctx.waitForNext();
		// Cue 1 ("Videowright"): the wordmark rises onto the word.
		lockup.revealWords();

		await ctx.waitForNext();
		// Cue 2 ("video team"): the tagline rises; then the hero hold.
		lockup.revealTagline();

		await ctx.waitForNext();
		// Release cue (after "technologies."): the camera rests before the push, within the window.
		const restFor = Math.min(ms("--dur-exit") * 1.4, (ADV[3] - ADV[2]) * 1000 - 50);
		amb.rest(restFor);
		await ctx.hold(restFor);
	},

	unmount() {
		// Only loops stop (via ctx.signal); the last frame stays for the transition. The HUD
		// chrome is shared with the next segment and stays up.
		host = null;
	},
});
