import type { Voiceover } from "videowright";
import cues from "../../../cues.json";

// The round-2 narration, joined by audio/assemble.mjs: the v2 one take (Cosman-1, ElevenLabs v4)
// with the voice beat's two takes in it (voice_then: Asher, ElevenLabs v2, +1.2 dB to match;
// voice_now: Cosman-1, ElevenLabs v4). audio.wav is a build intermediate (not committed): run
// `node audio/assemble.mjs` to make it.
const voiceover: Voiceover = {
	audio_file: "./audio.wav",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	voice: "Cosman-1",
	model: "eleven_v4",
	timing: {
		perSegment: Object.fromEntries(
			Object.entries(cues.segments).map(([id, s]) => [id, s.advances]),
		),
	},
	notes:
		"v2: retime check PASS (STT spellings only: 3D, GPU, UI, VideoWrite); retime apply with the 3D pair's pause at 1.4s. voice_then and voice_now: retime check PASS, used as taken. Assembled 70.25s.",
};

export default voiceover;
