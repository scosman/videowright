import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./voiceovers/v2/audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./voiceovers/v2/timing.json",
	timing: {
		perSegment: {
			"em-cold-open": [9.991],
			"em-title-card": [4.51],
			"em-web-tech-gallery": [16.37],
			"em-interactive-dev": [5.129],
			"em-pixel-perfect-export": [7.59],
			"em-voiceover-sync": [7.33],
			"em-any-coding-agent": [6.58],
			"em-install-cta": [7.81],
		},
	},
	notes:
		"Copied from demo_video/voiceovers/v2. Audio + provider timing are identical; perSegment keys remapped to em-* IDs for the editorial-mono fresh implementation. Audio ends at 62.16s.",
};

export default voiceover;
