import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	voice: "Cosman-1",
	model: "eleven_v4",
	// Synced with sync_algorithm.md against timing.json (this file placed at 0s). Advances sit
	// 0.15s before their cue word, a segment's last advance included (0.15s before the next
	// segment's first word); the exceptions are the cold open's hard cut, which falls in the
	// breath after "prompt.", and the title card's release, just after "technologies.".
	// From the gallery on, advances have three decimals so each lead is exactly 0.150s.
	// Only segments that exist are listed; later phases add theirs.
	timing: {
		perSegment: {
			// [0] 5.05 "with a single prompt" -> Video is ready. [1] 6.73 the cut (breath after "prompt." 6.28).
			"v2-cold-open": [5.05, 6.73],
			// [0] 0.47 "Videowright" (7.35) -> wordmark. [1] 4.19 "web" (11.07) -> UP NEXT readout.
			// [2] 5.45 release, after "technologies." (11.95). [3] 6.37 exit, before "That" (13.25).
			"v2-title-card": [0.47, 4.19, 5.45, 6.37],
			// Starts 13.10. [0] 2.677 "any" (15.927) -> ECharts. [1] 5.424 "advanced" (18.674) -> 3D +
			// Lottie. [2] 7.424 "Three.js" (20.674) lock. [3] 8.404 "Lottie" (21.654) lock, launch.
			// [4] 9.495 "even" (22.745) -> app. [5] 11.415 "rendered" (24.665) -> Customers.
			// [6] 13.585 "If" (26.835) -> send. [7] 15.365 "Videowright" (28.615) -> claim lock.
			// [8] 17.543 exit, before "Request" (30.793).
			"v2-web-tech-gallery": [2.677, 5.424, 7.424, 8.404, 9.495, 11.415, 13.585, 15.365, 17.543],
			// Starts 30.643. [0] 1.9 "and" (32.693) -> Enter. [1] 2.96 "reloads" (33.753) -> hot
			// reload. [2] 5.785 exit, before "One" (36.578).
			"v2-interactive-dev": [1.9, 2.96, 5.785],
		},
	},
	notes:
		"ElevenLabs v4 (portal), voice Cosman-1 (instant voice clone of the user), speed 1.00, stability 50, similarity 75. Raw take raw.mp3 + portal STT (raw_stt_portal.json -> raw_stt.json), retime check PASS, retime apply -> audio.mp3 (62.80s) + timing.json. Pause lengths in provider_script.md are re-tunable from the same take.",
};

export default voiceover;
