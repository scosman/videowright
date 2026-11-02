import type { Voiceover } from "videowright";

const voiceover: Voiceover = {
	audio_file: "./audio.mp3",
	provider: "elevenlabs",
	provider_timing_file: "./timing.json",
	voice: "tMvyQtpCVQ0DkixuYm6J",
	model: "eleven_multilingual_v2",
	// Not a timeline voiceover: one line placed into the v1 narration's voice-beat gap by the audio plan.
	timing: { perSegment: {} },
	notes:
		"ElevenLabs v2 (eleven_multilingual_v2, portal), stock voice Asher, stability 50, similarity 75 (May's demo_video settings). The voice beat's 'Then' line. retime check PASS (no differences); no pause markers, so audio.mp3 is the raw take (5.54s), words 0.12-5.24s. Integrated loudness -23.3 LUFS vs the narration's -19.9: the plan raises it 5.3 dB so the two voices are compared at the same loudness (matched on the A/B windows, not whole files: in the master the Asher line is -14.0 LUFS and the Cosman-1 line -13.3).",
};

export default voiceover;
