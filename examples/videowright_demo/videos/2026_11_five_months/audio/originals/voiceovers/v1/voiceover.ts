import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	voice: "Cosman-1",
	model: "eleven_v4",
	// Filled in by the sync step once the segments exist (see ../../../audio_plan.md and PLAN.md).
	timing: { perSegment: {} },
	notes:
		"ElevenLabs v4 (portal), voice Cosman-1 (the owner's instant voice clone), speed 1.00, stability 50, similarity 75. Raw take raw.mp3 + portal STT (raw_stt_portal.json -> raw_stt.json via specs/projects/demo_v2/tools/portal_to_canonical.mjs). retime check PASS (4 STT spelling diffs: 3D, GPU, UI, VideoWrite); retime apply -> audio.mp3 (73.33s, ending on the 5.0s end hold) + timing.json. The 9.0s gap after 'timed to every word.' holds the voice beat's Asher line (then_asher_v2), placed by the audio plan.",
};

export default voiceover;
