/**
 * `videowright dev` — boot a Vite dev server with the player pointed at
 * the consumer's timeline.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";
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

const VIRTUAL_SEGMENTS_ID = "virtual:vw-segments";
const RESOLVED_VIRTUAL_SEGMENTS_ID = `\0${VIRTUAL_SEGMENTS_ID}`;

/**
 * Scan the consumer's segments/ directory and return segment ids.
 * Each segments/<id>/index.ts becomes a discovered segment.
 */
function discoverSegmentIds(consumerRoot: string): string[] {
	const segmentsDir = join(consumerRoot, "segments");
	if (!existsSync(segmentsDir)) return [];

	const ids: string[] = [];
	let entries: string[];
	try {
		entries = readdirSync(segmentsDir);
	} catch {
		return [];
	}

	for (const entry of entries) {
		const entryPath = join(segmentsDir, entry);
		try {
			if (!statSync(entryPath).isDirectory()) continue;
		} catch {
			continue;
		}
		if (existsSync(join(entryPath, "index.ts"))) {
			ids.push(entry);
		}
	}

	return ids.sort();
}

/**
 * Vite plugin that provides a virtual module `virtual:vw-segments`.
 * The module exports a glob-style Record<string, () => Promise<Module>>
 * with explicit dynamic imports for each discovered segment, avoiding
 * the alias-in-glob issue with import.meta.glob.
 */
function segmentDiscoveryPlugin(consumerRoot: string): Plugin {
	return {
		name: "videowright-segment-discovery",
		resolveId(id) {
			if (id === VIRTUAL_SEGMENTS_ID) return RESOLVED_VIRTUAL_SEGMENTS_ID;
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_SEGMENTS_ID) return;

			const segmentIds = discoverSegmentIds(consumerRoot);
			const imports = segmentIds
				.map(
					(segId) =>
						`  "/segments/${segId}/index.ts": () => import("@consumer/segments/${segId}/index.ts")`,
				)
				.join(",\n");

			return `export default {\n${imports}\n};\n`;
		},
		configureServer(server: ViteDevServer) {
			const segmentsDir = join(consumerRoot, "segments");

			// Watch for added/removed segment directories.
			// On change, invalidate the virtual module so Vite re-runs load().
			const invalidate = () => {
				const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_SEGMENTS_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
					server.ws.send({ type: "full-reload" });
				}
			};

			// Chokidar is available via server.watcher (Vite's built-in watcher).
			// Watch for index.ts files being added/removed in segment subdirectories.
			server.watcher.add(segmentsDir);
			server.watcher.on("add", (path) => {
				if (path.endsWith("/index.ts") && path.includes(`${segmentsDir}/`)) {
					invalidate();
				}
			});
			server.watcher.on("unlink", (path) => {
				if (path.endsWith("/index.ts") && path.includes(`${segmentsDir}/`)) {
					invalidate();
				}
			});
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
