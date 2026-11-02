import type { AudioTrack } from "videowright";

// Timing is filled in by the sync step once the segments exist. The narration is placed at 0s,
// so its timing.json word times are track times.
const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 73.38,
	timing: { perSegment: {} },
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-11-02T16:20:00Z",
	notes:
		"Cosman-1 narration (v4) + the Asher v2 line at 42.60s (+5.3 dB, loudness-matched to the Cosman-1 line it is compared with) + music bed (0-42.3s, then its 127.6-146.33s from 54.60s) + 5 sweep whooshes. Two-pass master: -14.0 LUFS integrated, -1.7 dBTP.",
};

export default track;
