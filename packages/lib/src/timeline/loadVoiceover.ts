/**
 * Load a voiceover module from disk.
 *
 * Resolves the voiceover.ts file via the shared ts-loader, then
 * resolves audio_file and provider_timing_file to absolute paths.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { UserError } from "../cli/errors.js";
import { loadModule } from "../cli/ts_loader.js";
import type { Voiceover } from "../types.js";

export interface LoadVoiceoverArgs {
	videoFolder: string;
	slug: string;
}

export interface LoadVoiceoverResult {
	voiceover: Voiceover;
	voiceoverFolder: string;
	audioFilePath: string;
}

export async function loadVoiceover(args: LoadVoiceoverArgs): Promise<LoadVoiceoverResult> {
	const { videoFolder, slug } = args;

	const voiceoverPath = resolve(
		videoFolder,
		"audio",
		"originals",
		"voiceovers",
		slug,
		"voiceover.ts",
	);
	if (!existsSync(voiceoverPath)) {
		throw new UserError(
			`Voiceover not found: ${voiceoverPath}`,
			`Check that audio/originals/voiceovers/${slug}/voiceover.ts exists in your video folder.`,
		);
	}

	const mod = await loadModule(voiceoverPath);
	const voiceover = mod.default as Voiceover;

	if (!voiceover || typeof voiceover !== "object" || !voiceover.audio_file) {
		throw new UserError(
			`Invalid voiceover module at ${voiceoverPath}`,
			"The voiceover.ts file must default-export a Voiceover object with at least an audio_file field.",
		);
	}

	const voiceoverFolder = dirname(voiceoverPath);
	const audioFilePath = resolve(voiceoverFolder, voiceover.audio_file);

	if (!existsSync(audioFilePath)) {
		throw new UserError(
			`Voiceover audio file not found: ${audioFilePath}`,
			`The audio_file "${voiceover.audio_file}" referenced in ${voiceoverPath} does not exist.`,
		);
	}

	// Rewrite audio_file to an absolute path so callers can resolve it
	// without knowing the source folder.
	const resolvedVoiceover: Voiceover = {
		...voiceover,
		audio_file: audioFilePath,
		provider_timing_file: voiceover.provider_timing_file
			? resolve(voiceoverFolder, voiceover.provider_timing_file)
			: undefined,
	};

	return { voiceover: resolvedVoiceover, voiceoverFolder, audioFilePath };
}
