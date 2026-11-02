import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	voice: "Cosman-1",
	model: "eleven_v4",
	// The narration sits at 0s in track v1, so this is the track's timing (see its comments).
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
	notes:
		"ElevenLabs v4 (portal), voice Cosman-1 (the owner's instant voice clone), speed 1.00, stability 50, similarity 75. Raw take raw.mp3 + portal STT (raw_stt_portal.json -> raw_stt.json via specs/projects/demo_v2/tools/portal_to_canonical.mjs). retime check PASS (4 STT spelling diffs: 3D, GPU, UI, VideoWrite); retime apply -> audio.mp3 (73.33s, ending on the 5.0s end hold) + timing.json. The 9.0s gap after 'timed to every word.' holds the voice beat's Asher line (then_asher_v2), placed by the audio plan.",
};

export default voiceover;
