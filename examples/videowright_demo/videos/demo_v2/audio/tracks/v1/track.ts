import type { AudioTrack } from "videowright";

// Timing = the voiceover's timing (originals/voiceovers/v1/voiceover.ts) shifted by the VO's
// placement in this track (Cue 2, 0.6s). The shift is absorbed by the cold open, the first
// segment; every later segment's advances are relative to its own start and stay the same.
const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 63.4,
	timing: {
		perSegment: {
			// [0] 5.65 "with" (5.80) -> Video is ready. [1] 7.33 the hard cut, in the breath
			// between "prompt." (ends 6.88) and "Videowright" (7.95).
			"v2-cold-open": [5.65, 7.33],
			// [0] 0.47 -> wordmark on "Videowright" (7.95). [1] 4.19 -> UP NEXT on "web" (11.67).
			// [2] 5.45 release, after "technologies." (ends 12.55). [3] 6.37 exit, 0.15s before
			// "That" (13.85).
			"v2-title-card": [0.47, 4.19, 5.45, 6.37],
		},
	},
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-11-01T14:40:00Z",
	notes: "VO v1 (ElevenLabs v4, Cosman-1) at 0.6s, typing SFX under the cold open's prompt.",
};

export default track;
