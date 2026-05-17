import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	timing: {
		perSegment: {
			"cold-open": [9.991],
			"title-card": [4.51],
			"web-tech-gallery": [19.0],
			"interactive-dev": [4.0, 7.5],
			"pixel-perfect-export": [7.59],
			"voiceover-sync": [7.33],
			"any-coding-agent": [6.58],
			"install-cta": [7.81],
		},
	},
	notes:
		"ElevenLabs portal flow. v2 (multilingual). Tech-explainer tone. Derived from v1 with the 'Type a change. See it.' line cut via ffmpeg (37.799s–40.579s removed). Audio ends at 62.16s.",
};

export default voiceover;
