import type { AudioTrack } from "videowright";

const track: AudioTrack = {
	audio_file: "./audio/tracks/v2/track.mp3",
	length_s: 65.68,
	timing: {
		perSegment: {
			"cold-open": [10.606],
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
	created_at: "2026-05-16T09:05:00Z",
	notes:
		"VO + laptop typing SFX intro. Typing SFX plays 0.5-3.5s at 70%; VO delayed to 3.5s. Cold-open advance shifted by +3.5s versus v1 (7.106 -> 10.606); other segments unchanged. Mastered to -14 LUFS via loudnorm.",
};

export default track;
