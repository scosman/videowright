type SfxAsset = {
	name: string;
	description: string;
	length_s: number;
	source: "elevenlabs" | "user" | "openverse";
	notes?: string;
};

export const sfx: SfxAsset = {
	name: "Laptop typing",
	description: "Laptop chiclet keyboard, proficient typist, fast steady cadence, close-mic, dry",
	length_s: 3.0,
	source: "elevenlabs",
	notes:
		"Generated at duration_seconds=3.0, prompt_influence=0.4. Soft chiclet character (no mechanical click). Suitable as a 3s pre-VO intro bed under the cold-open typing animation.",
};

export default sfx;
