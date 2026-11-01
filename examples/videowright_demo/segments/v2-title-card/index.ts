import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { hudProbe, release, showHud } from "../../components/v2/hud.js";
import { css } from "../../components/v2/motion.js";
import { type Stage, createStage, flare, startAmbient } from "../../components/v2/stage.js";
import { REVEAL, type TitleLockup, createTitleLockup } from "../../components/v2/title-lockup.js";

// Beat 2: the hard cut lands here, the first frame of the instrument world: the grid and the
// HUD chrome are up on frame 1 and the mark's first stroke is already moving. The mark
// draws, the wordmark rises onto the VO's "Videowright", the HUD measures the lockup, and then
// the frame holds and breathes: the video's hero frame. The release lets the HUD go; the
// lockup stays for the transition to carry out.

let host: HTMLElement | null = null;
let stage: Stage;
let lockup: TitleLockup;

const pad4 = (v: number) => String(Math.round(v)).padStart(4, "0");

/** Peak alpha of the cut's bloom: measured to lift the plane around the mark ~40 luma. */
const BLOOM_ALPHA = 0.7;

// A one-shot light: a cyan pool around (x, y) on the plane, screen-blended, at full strength on
// its first frame and gone in 400ms. Removed when done, so nothing blends after it.
function bloom(on: Stage, x: number, y: number): void {
	const layer = document.createElement("div");
	layer.style.cssText = `position:absolute; inset:0; z-index:var(--z-key); pointer-events:none; mix-blend-mode:screen; background:radial-gradient(circle 520px at ${x}px ${y}px, rgba(91, 216, 245, ${BLOOM_ALPHA}), transparent)`;
	on.root.querySelector(".me-key")?.after(layer);
	layer
		.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 400,
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
	advances: [0.47, 4.19, 5.45, 6.37],
	voiceover: "Videowright turns a coding agent into a video team, using any web technologies.",
	notes:
		"Entered on a hard cut (timeline transition: 'cut'). Advance 1: the wordmark, 0.15s before 'Videowright'. Advance 2: 'UP NEXT · 03 WEB TECH', 0.15s before 'web'. Advance 3: release, after 'technologies.'. Advance 4: exit, 0.15s before the gallery's 'That'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 940, y: 470 }, scanPhase: 1800 });
		stage.setOrigin(960, 470);
		lockup = createTitleLockup(stage.content);
		// The HUD comes online with the cut: whole, no entrance, its clock starting here (also on
		// a dev restart or Prev, so the preview matches the render).
		showHud(el, { beat: 2, total: 8, section: "Title", restart: true, signal: ctx.signal });
	},

	async play(ctx) {
		if (!host) return;
		const { signal } = ctx;
		// The hero hold is seconds long: a quicker drift so the push reads (~2% by the release).
		const amb = startAmbient(ctx, stage, { driftMs: 7000 });
		// From frame 1: the strokes draw and the crosshair locks onto the V's vertex. The cut is
		// a light event: a cyan bloom around the mark (screen-blended over the plane, under the
		// mark) and the grid's crosses flash on its first frame and fall away within ~0.3s, as
		// the instrument comes on.
		lockup.revealMark();
		const v = lockup.vertex;
		flare(stage, v.x, v.y - 120, 0, 0, 500);
		bloom(stage, v.x, v.y - 120);
		hudProbe(`LOCK X ${pad4(v.x)} Y ${pad4(v.y)}`, REVEAL.lock, signal);

		await ctx.waitForNext();
		// Cue 1 ("Videowright"): the wordmark rises onto the word, then the HUD measures the
		// lockup (corners, grid flare, dimension) and the frame holds.
		const notes = lockup.revealWords(amb);
		const box = lockup.lockupBox();
		const after = (beat: number) => beat - REVEAL.wordmark;
		flare(stage, box.x + box.w / 2, box.y + box.h / 2, after(REVEAL.corners) + 420);
		hudProbe("TARGET LOCKED · 3 STROKES", after(REVEAL.measure) + 200, signal);

		await ctx.waitForNext();
		// Cue 2 ("web"): the HUD reads ahead to the next beat, the one event in the hero hold.
		hudProbe("UP NEXT · 03 WEB TECH", 0, signal);

		await ctx.waitForNext();
		// Release cue (after "technologies."): the HUD lets go, the camera rests.
		const out = release(notes.strokes, notes.marks);
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		// Only loops stop (via ctx.signal); the last frame stays for the transition. The HUD
		// chrome is shared with the next segment and stays up.
		host = null;
	},
});
