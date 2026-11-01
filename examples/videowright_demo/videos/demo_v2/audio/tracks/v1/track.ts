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
			// From the gallery on: the voiceover's timing (cues annotated in voiceover.ts).
			"v2-web-tech-gallery": [2.677, 5.424, 7.424, 8.404, 9.495, 11.415, 13.585, 15.365, 17.543],
			"v2-interactive-dev": [1.9, 2.96, 5.785],
			"v2-pixel-perfect-export": [1.22, 2.41, 3.65, 5.33, 7.521],
			"v2-voiceover-sync": [2.54, 5.44, 6.92, 8.922],
			"v2-any-coding-agent": [1.36, 3.737],
			// The end: 5.0s after "cold." (track 62.858), so the video runs to 67.858s and the
			// render pads the track's last 4.46s with silence.
			"v2-install-cta": [3.34, 10.65],
		},
	},
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-11-01T14:40:00Z",
	notes: "VO v1 (ElevenLabs v4, Cosman-1) at 0.6s, typing SFX under the cold open's prompt.",
};

export default track;
