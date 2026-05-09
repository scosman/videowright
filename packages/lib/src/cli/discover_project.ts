/**
 * Shared project discovery: finds config and timeline, throws UserError on missing.
 * Used by dev, script, record, and render commands.
 */

import { findConfig, findTimeline } from "./discover.js";
import { UserError } from "./errors.js";

export interface DiscoveredProject {
	configPath: string;
	timelinePath: string;
}

/**
 * Find config and timeline for a consumer project.
 * Throws UserError with actionable hints on missing config or timeline.
 *
 * @param cwd - Consumer repo root
 * @param positional - Optional explicit timeline path
 * @param commandName - Command name for error messages (e.g. "dev", "record")
 */
export function discoverProject(
	cwd: string,
	positional: string | undefined,
	commandName: string,
): DiscoveredProject {
	const configPath = findConfig(cwd);
	if (!configPath) {
		throw new UserError(
			`No videowright.config.ts found at ${cwd}`,
			"The Videowright skill can scaffold one. Run setup first.",
		);
	}

	const timelinePath = findTimeline(cwd, positional);
	if (!timelinePath) {
		throw new UserError(
			`No videos found at ${cwd}/videos/`,
			`Create one or pass a path: videowright ${commandName} <path-to-timeline>`,
		);
	}

	return { configPath, timelinePath };
}
