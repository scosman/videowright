import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./voiceovers/v1/audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./voiceovers/v1/timing.json",
	timing: {
		perSegment: {
			"cold-open": [9.991],
			"title-card": [4.51],
			"web-tech-gallery": [16.37],
			"interactive-dev": [7.909],
			"pixel-perfect-export": [7.59],
			"voiceover-sync": [7.33],
			"any-coding-agent": [4.63],
			"install-cta": [9.761],
		},
	},
	notes: "ElevenLabs portal flow. v2 (multilingual). Tech-explainer tone. Audio ends at 64.94s.",
};

export default voiceover;
