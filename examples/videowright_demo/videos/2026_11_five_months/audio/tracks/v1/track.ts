import type { AudioTrack } from "videowright";

// The narration is placed at 0s, so its timing.json word times are track times. Every cued
// advance fires on the frame 9 frames (0.150s) before its word's frame (as in demo_v2); a
// segment's exit is 0.15s before the next segment's first word. Segment starts (track s):
// fm-title 0, fm-pair-title-card 7.250, fm-pair-3d 15.433, fm-pair-product-ui 24.833,
// fm-pair-narration-sync 34.533, fm-voice 41.750, fm-cta 55.717.
const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 73.38,
	timing: {
		perSegment: {
			// "Same" (0.685), "same" (1.785), "Claude" (2.925): the claim's phrases. 6.300 the
			// morph, after "week." (6.145). 7.250 exit, before "In" (7.393).
			"fm-title": [0.533, 1.633, 2.783, 6.3, 7.25],
			// Starts 7.250. 3.450 the sweep, before "Now," (10.853). 8.183 exit, before "3D" (15.585).
			"fm-pair-title-card": [3.45, 8.183],
			// Starts 15.433. 2.800 the sweep, before "Now," (18.389). 9.400 exit, before "Product"
			// (24.982).
			"fm-pair-3d": [2.8, 9.4],
			// Starts 24.833. 3.567 the sweep, before "Now," (28.546). 9.700 exit, before "In" (34.678).
			"fm-pair-product-ui": [3.567, 9.7],
			// Starts 34.533. 3.167 the sweep, before "Now," (37.848). 7.217 exit at 41.750: the Now
			// clip has held 4.05s, and the Asher line starts at 42.60.
			"fm-pair-narration-sync": [3.167, 7.217],
			// Starts 41.750. 7.133 the sweep, before "This" (49.032). 13.967 exit, before "Both" (55.870).
			"fm-voice": [7.133, 13.967],
			// Starts 55.717. 1.300 the wordmark, before "VideoWrite," (57.170). 3.783 the tagline,
			// before "Claude" (59.650). 11.050 the link, before "Download" (66.910). 17.667 the end
			// of the track (73.383): the 5s end hold after "GitHub." (68.290).
			"fm-cta": [1.3, 3.783, 11.05, 17.667],
		},
	},
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-11-02T16:20:00Z",
	notes:
		"Cosman-1 narration (v4) + the Asher v2 line at 42.60s (+5.3 dB, loudness-matched to the Cosman-1 line it is compared with) + music bed (0-42.3s, then its 127.6-146.33s from 54.60s) + 5 sweep whooshes. Two-pass master: -14.0 LUFS integrated, -1.7 dBTP.",
};

export default track;
