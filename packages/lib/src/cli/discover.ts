/**
 * Config and timeline discovery for the CLI.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { UserError } from "./errors.js";

/**
 * Look for videowright.config.ts at the given cwd.
 * Returns the absolute path if found, null otherwise.
 */
export function findConfig(cwd: string): string | null {
	const configPath = join(cwd, "videowright.config.ts");
	return existsSync(configPath) ? resolve(configPath) : null;
}

/**
 * Find a timeline file.
 * - If hint is provided, resolve relative to cwd. Returns absolute path if found.
 *   Throws UserError if the explicit path does not exist.
 * - If no hint, scan cwd/videos/.../timeline.ts, sort by mtime desc, return the most recent.
 *   Returns null if no videos found (caller decides how to surface this).
 */
export function findTimeline(cwd: string, hint?: string): string | null {
	if (hint) {
		const resolved = resolve(cwd, hint);
		if (!existsSync(resolved)) {
			throw new UserError(
				`Timeline not found: ${resolved}`,
				`Check that the file exists. Expected at: ${resolved}`,
			);
		}
		return resolved;
	}

	const videosDir = join(cwd, "videos");
	if (!existsSync(videosDir)) return null;

	let entries: string[];
	try {
		entries = readdirSync(videosDir);
	} catch {
		return null;
	}

	const candidates: Array<{ path: string; mtime: number }> = [];

	for (const entry of entries) {
		const timelinePath = join(videosDir, entry, "timeline.ts");
		if (existsSync(timelinePath)) {
			const stat = statSync(timelinePath);
			candidates.push({ path: resolve(timelinePath), mtime: stat.mtimeMs });
		}
	}

	if (candidates.length === 0) return null;

	candidates.sort((a, b) => b.mtime - a.mtime);
	return candidates[0].path;
}
