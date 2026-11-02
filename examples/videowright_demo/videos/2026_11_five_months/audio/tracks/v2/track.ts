import type { AudioTrack } from "videowright";
import cues from "../../cues.json";

// Round 2. The timing is audio/cues.json's (audio/sync.mjs, from the assembled narration placed
// at 0s): every cued advance fires 9 frames (0.150s) before its word's frame.
const track: AudioTrack = {
	audio_file: "./audio/tracks/v2/track.mp3",
	length_s: 70.3,
	timing: {
		perSegment: Object.fromEntries(
			Object.entries(cues.segments).map(([id, s]) => [id, s.advances]),
		),
	},
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	created_at: "2026-11-02T18:50:00Z",
	notes:
		"Round 2: the assembled narration (v2 one take + voice_then, +1.2 dB, + voice_now), the music bed (its build until the voice beat, its close from after the voice beat), 5 sweep whooshes. Two-pass master: -13.9 LUFS integrated, -1.9 dBTP; the voice beat's lines -13.2 (Asher) and -13.3 (Cosman-1) LUFS.",
};

export default track;
