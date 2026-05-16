import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./voiceovers/v3/audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./voiceovers/v3/timing.json",
	timing: {
		perSegment: {
			"cold-open": [9.475],
			"title-card": [5.816],
			// 4 advances — one per panel boundary, anchored 0.15s before the
			// first keyword of each VO clause:
			//   adv 0 = before "Any library" (2.62)         — SVG → Charts
			//   adv 1 = before "Advanced 3 D" (5.08)        — Charts → 3D+Lottie
			//   adv 2 = before "Even your real product UI" (8.33) — 3D → App UI
			//   adv 3 = before next segment "Request" (17.56) — segment end
			"web-tech-gallery": [2.473, 4.934, 8.185, 17.414],
			// Two advances: adv 0 lands at end of "reloads." (gates the HMR swap),
			// adv 1 = segment end after the scripted 3s pause.
			"interactive-dev": [2.925, 6.595],
			"pixel-perfect-export": [7.047],
			"voiceover-sync": [8.87],
			"any-coding-agent": [4.18],
			// Last segment — extends ~5s past VO end ("cold." @ 65.247) so the
			// final frame holds before the video ends. Audio end ≈ 65.65s,
			// video end at 70.247s absolute.
			"install-cta": [10.85],
		},
	},
	notes:
		"ElevenLabs API (with-timestamps), voice Asher, model eleven_multilingual_v2. Generated 2026-05-15 from videos/demo_video/voiceovers/v3/provider_script.md. Audio duration 65.25s; install-cta padded with 5s tail hold → total video duration 70.25s.",
};

export default voiceover;
