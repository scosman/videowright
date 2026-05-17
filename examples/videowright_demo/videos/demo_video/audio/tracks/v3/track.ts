import type { AudioTrack } from "videowright";

const track: AudioTrack = {
	audio_file: "./audio/tracks/v3/track.mp3",
	length_s: 64.18,
	timing: {
		perSegment: {
			"cold-open": [9.106],
			"title-card": [5.445],
			"web-tech-gallery": [2.52, 4.645, 8.325, 17.265],
			"interactive-dev": [3.54, 5.7],
			"pixel-perfect-export": [6.873],
			"voiceover-sync": [9.3],
			"any-coding-agent": [4.157],
			"install-cta": [11.338],
		},
	},
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-05-16T09:20:00Z",
	notes:
		"VO + laptop typing SFX intro (truncated to 1.5s). Silence 0-0.5s, typing 0.5-2.0s at 70%, VO from 2.0s. Cold-open advance shifted by +2.0s vs v1 (7.106 -> 9.106); other segments unchanged. Mastered to -14 LUFS.",
};

export default track;
