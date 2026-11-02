import type { AudioTrack } from "videowright";

// Timing = the voiceover's timing (originals/voiceovers/v1/voiceover.ts) shifted by the VO's
// placement in this track (Cue 2, 0.6s). The shift is absorbed by the cold open, the first
// segment; every later segment's advances are relative to its own start and stay the same.
// Every cued advance fires on the frame 9 frames (0.150s) before its word's frame
// (specs/projects/demo_v2/tools/sync_advances.mjs).
const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 69.98,
	timing: {
		perSegment: {
			// [0] 5.65 "with" (5.80) -> Video is ready. [1] 7.833 the hard cut, in the breath
			// between "prompt." (ends 6.88) and "Videowright" (8.45).
			"v2-cold-open": [5.65, 7.833],
			// [0] 0.467 -> wordmark on "Videowright" (8.45). [1] 2.583 -> tagline on "video"
			// (10.57). [2] 5.45 release, after "technologies." (ends 13.05). [3] 5.967 exit,
			// 0.15s before "That" (13.95).
			"v2-title-card": [0.467, 2.583, 5.45, 5.967],
			// From the gallery on: the voiceover's timing (cues annotated in voiceover.ts).
			"v2-web-tech-gallery": [2.683, 5.417, 8.4, 9.5, 11.417, 15.367, 18.15],
			"v2-interactive-dev": [1.9, 2.95, 5.483],
			"v2-pixel-perfect-export": [1.217, 3.65, 5.317, 7.917],
			"v2-voiceover-sync": [2.533, 5.433, 6.917, 8.917],
			"v2-any-coding-agent": [1.367, 5.033],
			// The end: the track's last frame, 5.0s after "cold." (track 64.96) and the take's
			// [[pause 5.0s]] tail: the video runs to 69.98s, the end of the audio, unpadded.
			"v2-install-cta": [3.35, 10.683],
		},
	},
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-11-02T16:00:00Z",
	notes:
		"VO v1 (ElevenLabs v4, Cosman-1, pauses re-tuned in Phase 6) at 0.6s, typing SFX under the cold open's prompt. Two-pass linear master: -14.0 LUFS, -2.1 dBTP.",
};

export default track;
