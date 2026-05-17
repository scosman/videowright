import type { AudioTrack } from "videowright";

const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 62.16,
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
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-05-16T00:00:00Z",
	notes:
		"VO-only track migrated from legacy voiceover layout. Audio is byte-identical to audio/originals/voiceovers/v2/audio.mp3 (shared with demo_video). Duration 62.16s.",
};

export default track;
