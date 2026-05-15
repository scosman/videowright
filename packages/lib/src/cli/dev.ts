/**
 * `videowright dev` — boot a Vite dev server for the whole project.
 * Discovers all videos at boot and exposes them via a virtual module.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { findConfig } from "./discover.js";
import { discoverAllVideos } from "./discover_project.js";
import { UserError } from "./errors.js";
import type { VwGlobals } from "./vite_helpers.js";
import {
	findPackageRoot,
	fullReloadPlugin,
	globalsVirtualModulePlugin,
	projectVirtualModulePlugin,
	segmentDiscoveryPlugin,
	spaFallbackPlugin,
} from "./vite_helpers.js";

export interface DevOptions {
	cwd: string;
	port?: number;
	verbose?: boolean;
}

export interface DevResult {
	url: string;
	close: () => Promise<void>;
}

/**
 * Run the dev server flow. Returns the running server info.
 * Throws UserError on missing config.
 */
export async function runDev(opts: DevOptions): Promise<DevResult> {
	const { cwd, port, verbose } = opts;

	// Validate config exists (fast error before Vite boot)
	const configPath = findConfig(cwd);
	if (!configPath) {
		throw new UserError(
			`No videowright.config.ts found at ${cwd}`,
			"The Videowright skill can scaffold one. Run setup first.",
		);
	}

	if (verbose) {
		console.log(`config: ${configPath}`);
	}

	const pkgRoot = findPackageRoot();
	const entryDir = resolve(pkgRoot, "src/cli/entry");

	if (!existsSync(resolve(entryDir, "index.html"))) {
		throw new UserError(
			"Internal entry HTML not found",
			"Reinstall videowright; this is a packaging bug.",
		);
	}

	const serverPort = port ?? 5173;

	// Discover all videos. Initial discovery uses plain import() since
	// the Vite server isn't started yet. Reloads (triggered by file
	// changes) use ssrLoadModule for reliable Vite-aware loading.
	const projectInfo = await discoverAllVideos(cwd);

	if (verbose) {
		console.log(`videos discovered: ${projectInfo.videos.length}`);
		for (const v of projectInfo.videos) {
			console.log(
				`  ${v.slug}: "${v.title}" (${v.style})${v.loadError ? ` [error: ${v.loadError}]` : ""}`,
			);
		}
	}

	// Globals for the entry files. In multi-video mode, timelinePath is unused
	// (video_view.ts reads per-video paths from ProjectInfo). It's still required
	// by the VwGlobals interface because render_entry.ts uses it.
	const globals: VwGlobals = {
		timelinePath: "",
		consumerRoot: cwd,
	};

	// We need a mutable reference to the server for the reload callback.
	// The variable is assigned right after createServer returns, before any
	// reload can fire.
	let serverRef: Awaited<ReturnType<typeof import("vite").createServer>> | null = null;

	const { createServer } = await import("vite");

	const server = await createServer({
		configFile: false,
		root: entryDir,
		plugins: [
			fullReloadPlugin(),
			segmentDiscoveryPlugin(cwd),
			globalsVirtualModulePlugin(globals),
			spaFallbackPlugin(),
			projectVirtualModulePlugin(projectInfo, {
				consumerRoot: cwd,
				onReload: () => discoverAllVideos(cwd, serverRef ?? undefined),
			}),
		],
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
	});

	serverRef = server;

	await server.listen();

	const address = server.resolvedUrls?.local?.[0] ?? `http://localhost:${serverPort}/`;

	return {
		url: address,
		close: () => server.close(),
	};
}
