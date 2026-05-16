import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./voiceovers/v4/audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./voiceovers/v4/timing.json",
	timing: {
		perSegment: {
			"cold-open": [7.106],
			"title-card": [5.445],
			// 4 advances — one per panel boundary, anchored 0.15s before the
			// first keyword of each VO clause:
			//   adv 0 = before "Any" (15.221)            — SVG → Charts
			//   adv 1 = before "Advanced" (17.346)       — Charts → 3D+Lottie
			//   adv 2 = before "Even" (21.026)           — 3D → App UI
			//   adv 3 = before next segment "Request" (29.966) — segment end
			"web-tech-gallery": [2.52, 4.645, 8.325, 17.265],
			// Two advances: adv 0 lands at end of "reloads." to gate the HMR swap,
			// adv 1 = segment end before "One" of pixel-perfect-export.
			"interactive-dev": [3.54, 5.7],
			"pixel-perfect-export": [6.873],
			"voiceover-sync": [9.3],
			"any-coding-agent": [4.157],
			// Last segment — extends 5s past VO end ("cold." @ 62.184) so the
			// final frame holds before the video ends. Total video ~67.18s.
			"install-cta": [11.338],
		},
	},
	notes:
		"ElevenLabs API (with-timestamps), voice Asher, model eleven_multilingual_v2. Generated 2026-05-15 from videos/demo_video/voiceovers/v4/provider_script.md. Audio duration 62.18s; install-cta padded with 5s tail hold → total video duration ~67.18s.",
};

export default voiceover;
