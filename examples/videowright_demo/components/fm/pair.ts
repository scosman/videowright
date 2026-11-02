import { type Segment, defineSegment } from "videowright";
import cues from "../../videos/2026_11_five_months/audio/cues.json";
import { fontsReady } from "../v2/fonts.js";
import { createStage } from "../v2/stage.js";
import { type Clip, createClip } from "./clip.js";
import { type Rig, createRig } from "./rig.js";

// A Then/Now pair: the rig (rig.ts) with the Then clip playing from the segment's first frame,
// the sweep on the first advance (0.15s before the narration's "Now"), and the Now clip
// playing from the sweep. Every pair is the same rig at the same pixels, so pairs are joined
// by hard cuts; a pair entered from another pair starts with the marker at NOW and rewinds it,
// and the first pair (after the title) builds the rig in. Advances: [sweep, exit], from
// audio/cues.json (audio/sync.mjs), the same values the track carries.

export interface PairSpec {
	id: string;
	/** The clips' URLs. */
	thenSrc: string;
	nowSrc: string;
	/** [Then caption, Now caption]. */
	captions: [string, string];
	/** "title": entered from the title card (marker already at THEN); "pair": from a pair. */
	enteredFrom: "title" | "pair";
	voiceover: string;
	notes?: string;
}

export function definePair(spec: PairSpec): Segment {
	let rig: Rig;
	let thenClip: Clip;
	let nowClip: Clip;
	return defineSegment({
		id: spec.id,
		advances: (cues.segments as Record<string, { advances: number[] }>)[spec.id].advances,
		voiceover: spec.voiceover,
		notes: spec.notes,

		async mount(el) {
			await fontsReady();
			// The grid plane behind the rig. No ambient camera: the rig must not move.
			createStage(el, { key: { x: 960, y: 440 } });
			rig = createRig(el, {
				captions: spec.captions,
				state: spec.enteredFrom === "pair" ? "now" : "then",
				entering: spec.enteredFrom === "title",
			});
			thenClip = createClip(rig.thenLayer, { src: spec.thenSrc });
			nowClip = createClip(rig.nowLayer, { src: spec.nowSrc });
			await Promise.all([thenClip.ready, nowClip.ready]);
		},

		async play(ctx) {
			thenClip.start(ctx);
			if (spec.enteredFrom === "pair") rig.rewind();
			else rig.enter();
			await ctx.waitForNext();
			nowClip.start(ctx);
			rig.sweep();
			await ctx.waitForNext();
		},
	});
}
