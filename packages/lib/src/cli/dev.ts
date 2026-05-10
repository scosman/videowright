/**
 * `videowright dev` — boot a Vite dev server with the player pointed at
 * the consumer's timeline.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Timeline } from "../types.js";
import { discoverProject } from "./discover_project.js";
import { UserError } from "./errors.js";
import { loadModule } from "./ts_loader.js";
import { findPackageRoot, fullReloadPlugin, segmentDiscoveryPlugin } from "./vite_helpers.js";

export interface DevOptions {
	cwd: string;
	positional?: string;
	port?: number;
	verbose?: boolean;
	/** Extra Vite `define` entries, merged into the config. Used by record to inject voiceover globals. */
	extraDefines?: Record<string, string>;
}

export interface DevResult {
	url: string;
	close: () => Promise<void>;
}

/**
 * Run the dev server flow. Returns the running server info.
 * Throws UserError on missing config / timeline.
 */
export async function runDev(opts: DevOptions): Promise<DevResult> {
	const { cwd, positional, port, verbose } = opts;

	const { configPath, timelinePath } = discoverProject(cwd, positional, "dev");

	// Load config (validates it can be loaded; entry client re-loads it via Vite)
	await loadModule(configPath);

	// Resolve default_voiceover audio path for dev mode.
	// When called from record.ts, extraDefines already contains voiceover globals,
	// so we only do this when no voiceover defines are present.
	const voiceoverDefines: Record<string, string> = {};
	const hasExternalVoiceoverConfig =
		opts.extraDefines?.__VW_AUDIO_FILE__ !== undefined ||
		opts.extraDefines?.__VW_VOICEOVER_NONE__ !== undefined;

	if (!hasExternalVoiceoverConfig) {
		try {
			const timelineMod = await loadModule(timelinePath);
			const timeline = timelineMod.default as Timeline;
			if (timeline.default_voiceover) {
				// default_voiceover.audio_file is relative to the video folder
				// (the directory containing timeline.ts) per the Voiceover type contract.
				const videoFolder = dirname(timelinePath);
				const audioAbsPath = resolve(videoFolder, timeline.default_voiceover.audio_file);
				if (existsSync(audioAbsPath)) {
					voiceoverDefines.__VW_AUDIO_FILE__ = JSON.stringify(`/@fs/${audioAbsPath}`);
				} else if (verbose) {
					console.warn(`default_voiceover audio file not found: ${audioAbsPath}`);
				}
			}
		} catch {
			// Timeline may fail to load (e.g. syntax error); entry_client will
			// report the error via its own import. Don't block dev server boot.
		}
	}

	if (verbose) {
		console.log(`config: ${configPath}`);
		console.log(`timeline: ${timelinePath}`);
	}

	// Build Vite config and boot server
	const { createServer } = await import("vite");

	const pkgRoot = findPackageRoot();
	const entryDir = resolve(pkgRoot, "src/cli/entry");

	if (!existsSync(resolve(entryDir, "index.html"))) {
		throw new UserError(
			"Internal entry HTML not found",
			"Reinstall videowright; this is a packaging bug.",
		);
	}

	const serverPort = port ?? 5173;

	const server = await createServer({
		configFile: false,
		root: entryDir,
		plugins: [fullReloadPlugin(), segmentDiscoveryPlugin(cwd)],
		server: {
			port: serverPort,
			strictPort: false,
			fs: {
				allow: [cwd, pkgRoot],
			},
		},
		resolve: {
			alias: {
				"@consumer": cwd,
			},
		},
		define: {
			__VW_TIMELINE_PATH__: JSON.stringify(timelinePath),
			__VW_CONSUMER_ROOT__: JSON.stringify(cwd),
			...voiceoverDefines,
			...(opts.extraDefines ?? {}),
		},
	});

	await server.listen();

	const address = server.resolvedUrls?.local?.[0] ?? `http://localhost:${serverPort}/`;

	return {
		url: address,
		close: () => server.close(),
	};
}
