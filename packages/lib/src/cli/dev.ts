/**
 * `videowright dev` — boot a Vite dev server with the player pointed at
 * the consumer's timeline.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { discoverProject } from "./discover_project.js";
import { UserError } from "./errors.js";
import { loadModule } from "./ts_loader.js";
import { findPackageRoot, fullReloadPlugin, segmentDiscoveryPlugin } from "./vite_helpers.js";

export interface DevOptions {
	cwd: string;
	positional?: string;
	port?: number;
	verbose?: boolean;
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
		},
	});

	await server.listen();

	const address = server.resolvedUrls?.local?.[0] ?? `http://localhost:${serverPort}/`;

	return {
		url: address,
		close: () => server.close(),
	};
}
