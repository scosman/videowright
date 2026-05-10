/**
 * Validation for Timing and Voiceover objects.
 *
 * Called at CLI startup after loading timeline / voiceover modules.
 * Errors block execution; warnings are printed but do not block.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Timing, Voiceover } from "../types.js";

export type ValidationResult =
	| { ok: true; warnings: string[] }
	| { ok: false; errors: string[]; warnings: string[] };

/**
 * Validate a Timing object against known segment ids.
 *
 * - Warns on segment ids in `perSegment` that are not in `segmentIds`.
 * - Errors on non-array values, empty arrays, non-positive numbers, or non-finite numbers.
 */
export function validateTiming(timing: Timing, segmentIds: string[]): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const knownIds = new Set(segmentIds);

	for (const [segId, advances] of Object.entries(timing.perSegment)) {
		if (!knownIds.has(segId)) {
			warnings.push(
				`Timing references unknown segment "${segId}" -- possible typo or renamed segment.`,
			);
		}

		if (!advances) continue;

		if (!Array.isArray(advances)) {
			errors.push(`Timing for segment "${segId}": expected an array of numbers.`);
			continue;
		}

		if (advances.length === 0) {
			errors.push(`Timing for segment "${segId}": advances array must not be empty.`);
			continue;
		}

		for (let i = 0; i < advances.length; i++) {
			const v = advances[i];
			if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
				errors.push(
					`Timing for segment "${segId}": advances[${i}] must be a positive finite number (got ${v}).`,
				);
			}
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors, warnings };
	}
	return { ok: true, warnings };
}

/**
 * Validate a Voiceover object's file references.
 *
 * - Errors if `audio_file` does not exist on disk.
 * - Warns if `provider_timing_file` is set but does not exist.
 */
export function validateVoiceover(voiceover: Voiceover, voiceoverFolder: string): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const audioPath = resolve(voiceoverFolder, voiceover.audio_file);
	if (!existsSync(audioPath)) {
		errors.push(`Voiceover audio file not found: ${audioPath}`);
	}

	if (voiceover.provider_timing_file) {
		const timingPath = resolve(voiceoverFolder, voiceover.provider_timing_file);
		if (!existsSync(timingPath)) {
			warnings.push(`Voiceover provider timing file not found: ${timingPath}`);
		}
	}

	if (errors.length > 0) {
		return { ok: false, errors, warnings };
	}
	return { ok: true, warnings };
}
