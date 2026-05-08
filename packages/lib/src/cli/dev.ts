/**
 * `videowright dev` — boot a Vite dev server with the player pointed at
 * the consumer's timeline.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { findConfig, findTimeline } from "./discover.js";
import { UserError } from "./errors.js";
import { loadModule } from "./ts_loader.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Find the videowright package root by walking up from __dirname.
 * Needed to locate the entry HTML which ships in src/cli/entry/.
 */
function findPackageRoot(): string {
	let dir = __dirname;
	for (let i = 0; i < 10; i++) {
		const pkgPath = resolve(dir, "package.json");
		if (existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
				if (pkg.name === "videowright") return dir;
			} catch {
				// keep going
			}
		}
		dir = dirname(dir);
	}
	// Fallback: assume __dirname is inside dist/cli/ or src/cli/
	return resolve(__dirname, "../..");
}

/**
 * Vite plugin that forces a full page reload on every file change,
 * bypassing HMR module replacement. The player + hash routing handles
 * restoring position after reload.
 */
function fullReloadPlugin(): Plugin {
	return {
		name: "videowright-full-reload",
		handleHotUpdate({ server }) {
			server.ws.send({ type: "full-reload" });
			return [];
		},
	};
}

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

	// 1. Find config
	const configPath = findConfig(cwd);
	if (!configPath) {
		throw new UserError(
			`No videowright.config.ts found at ${cwd}`,
			"The Videowright skill can scaffold one. Run setup first.",
		);
	}

	// 2. Find timeline (findTimeline throws UserError if explicit hint missing)
	const timelinePath = findTimeline(cwd, positional);
	if (!timelinePath) {
		throw new UserError(
			`No videos found at ${cwd}/videos/`,
			"Create one or pass a path: videowright dev <path-to-timeline>",
		);
	}

	// 3. Load config (validates it can be loaded; entry client re-loads it via Vite)
	await loadModule(configPath);

	if (verbose) {
		console.log(`config: ${configPath}`);
		console.log(`timeline: ${timelinePath}`);
	}

	// 4. Build Vite config and boot server
	const { createServer } = await import("vite");

	// The entry HTML ships at <package-root>/src/cli/entry/
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
		plugins: [fullReloadPlugin()],
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
