// SfxAsset is not exported by videowright yet, so the shape is declared inline.
interface SfxAsset {
	name: string;
	description: string;
	length_s: number;
	source: "elevenlabs" | "user" | "openverse";
	notes?: string;
}

export const sfx: SfxAsset = {
	name: "Laptop typing",
	description: "Fast typing on a laptop keyboard: two bursts of keystrokes with a breath between",
	length_s: 3.0,
	source: "user",
	notes:
		"Reused byte-for-byte from this project's demo_video audio (videos/demo_video/audio/originals/sfx/laptop_typing/audio.mp3). Keys at 0.02-1.53s and 1.77-2.38s (about 10 per second, onsets listed in components/v2/typing.ts), silent from 2.45s. Under the cold open's typed prompt; single keys are sliced out for the paste and Enter.",
};

export default sfx;
