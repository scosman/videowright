/**
 * Shared project discovery: finds config and timeline, throws UserError on missing.
 * Used by dev and render commands.
 */

import { statSync } from "node:fs";
import { basename, dirname } from "node:path";
import type { ViteDevServer } from "vite";
import type { Config, ProjectInfo, Timeline, VideoSummary } from "../types.js";
import { findAllTimelines, findConfig, findTimeline } from "./discover.js";
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
 * @param commandName - Command name for error messages (e.g. "dev", "render")
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

/**
 * Discover the project and load summaries for every video under videos/.
 * Used by `dev` (whole project) and `render` (when prompting / auto-picking).
 *
 * When a Vite server is provided, timelines are loaded via `ssrLoadModule`
 * which handles Vite-specific imports (CSS, virtual modules). Without a
 * server, uses dynamic `import()` which may fail for files with Vite imports.
 */
export async function discoverAllVideos(
	root: string,
	viteServer?: ViteDevServer,
): Promise<ProjectInfo> {
	const timelinePaths = findAllTimelines(root);

	// Load config for default style fallback
	let defaultStyle = "unknown";
	const configPath = findConfig(root);
	if (configPath) {
		try {
			let configMod: Record<string, unknown>;
			if (viteServer) {
				configMod = (await viteServer.ssrLoadModule(configPath)) as Record<string, unknown>;
			} else {
				configMod = (await import(configPath)) as Record<string, unknown>;
			}
			const config = configMod.default as Config | undefined;
			if (config?.defaultStyle) {
				defaultStyle = config.defaultStyle;
			}
		} catch {
			// Config load failure is not fatal for discovery
		}
	}

	const videos: VideoSummary[] = [];

	for (const timelinePath of timelinePaths) {
		const videoDir = dirname(timelinePath);
		const slug = basename(videoDir);

		let mtimeMs = 0;
		try {
			mtimeMs = statSync(timelinePath).mtimeMs;
		} catch {
			// If stat fails, keep 0
		}

		let title = slug;
		let style = defaultStyle;
		let loadError: string | undefined;

		try {
			let timelineMod: Record<string, unknown>;
			if (viteServer) {
				timelineMod = (await viteServer.ssrLoadModule(timelinePath)) as Record<string, unknown>;
			} else {
				timelineMod = (await import(timelinePath)) as Record<string, unknown>;
			}
			const timeline = timelineMod.default as Timeline | undefined;
			if (timeline?.meta?.title) {
				title = timeline.meta.title;
			}
			if (timeline?.meta?.style) {
				style = timeline.meta.style;
			}
		} catch (e) {
			loadError = e instanceof Error ? e.message : String(e);
		}

		videos.push({
			slug,
			timelinePath,
			title,
			style,
			mtimeMs,
			loadError,
		});
	}

	// Sort by mtime descending (most recently modified first)
	videos.sort((a, b) => b.mtimeMs - a.mtimeMs);

	return {
		projectName: basename(root),
		videos,
	};
}
