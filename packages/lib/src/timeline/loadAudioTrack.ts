/**
 * Load an audio track module from disk.
 *
 * Resolves the track.ts file via the shared ts-loader, then
 * resolves audio_file to an absolute path.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { UserError } from "../cli/errors.js";
import { loadModule } from "../cli/ts_loader.js";
import type { AudioTrack } from "../types.js";

export interface LoadAudioTrackArgs {
	videoFolder: string;
	trackId: string;
}

export interface LoadAudioTrackResult {
	audioTrack: AudioTrack;
	trackFolder: string;
	audioFilePath: string;
}

export async function loadAudioTrack(args: LoadAudioTrackArgs): Promise<LoadAudioTrackResult> {
	const { videoFolder, trackId } = args;

	const trackPath = resolve(videoFolder, "audio", "tracks", trackId, "track.ts");
	if (!existsSync(trackPath)) {
		throw new UserError(
			`Audio track not found: ${trackPath}`,
			`Check that audio/tracks/${trackId}/track.ts exists in your video folder.`,
		);
	}

	const mod = await loadModule(trackPath);
	const audioTrack = mod.default as AudioTrack;

	if (!audioTrack || typeof audioTrack !== "object" || !audioTrack.audio_file) {
		throw new UserError(
			`Invalid audio track module at ${trackPath}`,
			"The track.ts file must default-export an AudioTrack with audio_file, length_s, and timing.",
		);
	}

	if (typeof audioTrack.length_s !== "number" || !Number.isFinite(audioTrack.length_s)) {
		throw new UserError(
			`Audio track missing valid length_s in ${trackPath}`,
			`track.ts must export length_s as a finite number (got ${typeof audioTrack.length_s}).`,
		);
	}

	if (
		!audioTrack.timing ||
		typeof audioTrack.timing !== "object" ||
		typeof audioTrack.timing.perSegment !== "object" ||
		audioTrack.timing.perSegment === null
	) {
		throw new UserError(
			`Audio track missing valid timing in ${trackPath}`,
			"track.ts must export a timing object with a perSegment field.",
		);
	}

	const trackFolder = dirname(trackPath);
	const audioFilePath = resolve(trackFolder, audioTrack.audio_file);

	if (!existsSync(audioFilePath)) {
		throw new UserError(
			`Audio track file not found: ${audioFilePath}`,
			`The audio_file "${audioTrack.audio_file}" referenced in ${trackPath} does not exist. Re-run the audio build step.`,
		);
	}

	const resolvedAudioTrack: AudioTrack = {
		...audioTrack,
		audio_file: audioFilePath,
	};

	return { audioTrack: resolvedAudioTrack, trackFolder, audioFilePath };
}
