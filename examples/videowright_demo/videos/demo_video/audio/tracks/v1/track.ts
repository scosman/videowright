import type { AudioTrack } from "videowright";

const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 62.18,
	timing: {
		perSegment: {
			"cold-open": [7.106],
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
	created_at: "2026-05-16T00:00:00Z",
	notes:
		"VO-only track migrated from legacy voiceover layout. Audio is byte-identical to audio/originals/voiceovers/v4/audio.mp3. Duration 62.18s; install-cta padded with 5s tail hold.",
};

export default track;
