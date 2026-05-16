import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./voiceovers/v2/audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./voiceovers/v2/timing.json",
	timing: {
		perSegment: {
			"rs-cold-open": [9.991],
			"rs-title-card": [4.51],
			"rs-web-tech-gallery": [16.37],
			"rs-interactive-dev": [5.129],
			"rs-pixel-perfect-export": [7.59],
			"rs-voiceover-sync": [7.33],
			"rs-any-coding-agent": [6.58],
			"rs-install-cta": [7.81],
		},
	},
	notes:
		"Copied from demo_editorial_mono/voiceovers/v2 (byte-identical audio + timing). perSegment keys remapped to rs-* IDs for the risograph fresh implementation. Audio ends at 62.16s.",
};

export default voiceover;
