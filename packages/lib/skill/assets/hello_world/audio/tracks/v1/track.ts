import type { AudioTrack } from "videowright";

const track: AudioTrack = {
	audio_file: "./audio/tracks/v1/track.mp3",
	length_s: 12.0,
	// Empty timing is deliberate: no per-segment overrides yet. Segments fall
	// back to their own `advances` arrays. Populate after syncing VO to audio.
	timing: { perSegment: {} },
	audio_plan_path: "../../audio_plan.md",
	plan_snapshot_path: "./plan_snapshot.md",
	notes: "Silent placeholder track. Add a voice-over, SFX, or music to replace.",
};

export default track;
