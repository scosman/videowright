import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	voice: "Cosman-1",
	model: "eleven_v4",
	// Synced with sync_algorithm.md against timing.json (this file placed at 0s), frame-exact
	// (specs/projects/demo_v2/tools/sync_advances.mjs). Each cued advance fires on the frame 9
	// frames (0.150s) before its word's frame, a segment's last advance included (before the
	// next segment's first word); the exceptions are the cold open's hard cut, which falls in the
	// breath after "prompt.", and the title card's release, just after "technologies.". The
	// last segment's final advance is the end of the audio: the take's [[pause 5.0s]] tail, the
	// end hold after "cold.".
	timing: {
		perSegment: {
			// [0] 5.05 "with a single prompt" -> Video is ready. [1] 7.233 the cut (breath after
			// "prompt." 6.28).
			"v2-cold-open": [5.05, 7.233],
			// [0] 0.467 "Videowright" (7.848) -> wordmark. [1] 2.583 "video" (9.968) -> tagline.
			// [2] 5.45 release, after "technologies.". [3] 5.967 exit, before "That" (13.354).
			"v2-title-card": [0.467, 2.583, 5.45, 5.967],
			// Starts 13.200. [0] 2.683 "any" (16.027) -> ECharts. [1] 5.417 "advanced"
			// (18.774) -> 3D + Lottie. [2] 8.4 "Lottie" (21.754) launch. [3] 9.5 "even"
			// (22.845) -> app. [4] 11.417 "rendered" (24.765) -> Customers. [5] 15.367
			// "Videowright" (28.715) -> send, toast. [6] 18.15 exit, before "Request" (31.493).
			"v2-web-tech-gallery": [2.683, 5.417, 8.4, 9.5, 11.417, 15.367, 18.15],
			// Starts 31.350. [0] 1.9 "and" (33.393) -> Enter. [1] 2.95 "reloads" (34.453) -> hot
			// reload. [2] 5.483 exit, before "One" (36.978).
			"v2-interactive-dev": [1.9, 2.95, 5.483],
			// Starts 36.833. [0] 1.217 "your" (38.198) -> Enter, the render runs. [1] 3.65
			// "pixel-perfect" (40.628) -> the player opens. [2] 5.317 "not" (42.308) -> the
			// camera leans in. [3] 7.917 exit, before "Your" (44.899).
			"v2-pixel-perfect-export": [1.217, 3.65, 5.317, 7.917],
			// Starts 44.750. [0] 2.533 "The" (47.439) -> line 2. [1] 5.433 "Edit" (50.339) -> the
			// cursor retypes line 3. [2] 6.917 "resyncs" (51.819) -> the block re-times. [3] 8.917
			// exit, before "And" (53.821).
			"v2-voiceover-sync": [2.533, 5.433, 6.917, 8.917],
			// Starts 53.667. [0] 1.367 "every" (55.181) -> the agents arrive. [1] 5.033
			// exit, the match cut, before "Install" (58.858).
			"v2-any-coding-agent": [1.367, 5.033],
			// Starts 58.700. [0] 3.35 "You'll" (62.198) -> the destination turns amber.
			// [1] 10.683 the end of the audio: "cold." ends 64.358, then the 5.0s end hold.
			"v2-install-cta": [3.35, 10.683],
		},
	},
	notes:
		"ElevenLabs v4 (portal), voice Cosman-1 (instant voice clone of the user), speed 1.00, stability 50, similarity 75. Raw take raw.mp3 + portal STT (raw_stt_portal.json -> raw_stt.json), retime check PASS, retime apply -> audio.mp3 (69.38s, pauses re-tuned to the built animation in Phase 6, ending on the 5.0s end hold) + timing.json. Pause lengths in provider_script.md are re-tunable from the same take.",
};

export default voiceover;
