/**
 * Shared Vite helpers used by dev.ts and render.ts.
 * Extracted to avoid coupling dev.ts internals to render.ts.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, Plugin, ViteDevServer } from "vite";
import type { ProjectInfo } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Find the videowright package root by walking up from __dirname.
 * Needed to locate the entry HTML which ships in src/cli/entry/.
 */
export function findPackageRoot(): string {
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
export function fullReloadPlugin(): Plugin {
	return {
		name: "videowright-full-reload",
		handleHotUpdate({ server }) {
			server.ws.send({ type: "full-reload" });
			return [];
		},
	};
}

/**
 * Shape of globals injected into entry files via the virtual module.
 */
export interface VwGlobals {
	timelinePath: string;
	consumerRoot: string;
	audioFile?: string;
	resolvedTiming?: Record<string, number[]>;
	voiceoverNone?: boolean;
	renderFps?: number;
}

const VIRTUAL_GLOBALS_ID = "virtual:vw-globals";
const RESOLVED_VIRTUAL_GLOBALS_ID = `\0${VIRTUAL_GLOBALS_ID}`;

/**
 * Vite plugin that provides a virtual module `virtual:vw-globals`.
 * The module exports concrete values that were previously injected via
 * Vite's `define:` config. Using a virtual module avoids text-substitution
 * issues where `define` would rewrite `declare const` lines.
 */
export function globalsVirtualModulePlugin(globals: VwGlobals): Plugin {
	return {
		name: "videowright-globals",
		resolveId(id) {
			if (id === VIRTUAL_GLOBALS_ID) return RESOLVED_VIRTUAL_GLOBALS_ID;
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_GLOBALS_ID) return;

			const lines: string[] = [];
			lines.push(`export const timelinePath = ${JSON.stringify(globals.timelinePath)};`);
			lines.push(`export const consumerRoot = ${JSON.stringify(globals.consumerRoot)};`);
			lines.push(
				`export const audioFile = ${globals.audioFile !== undefined ? JSON.stringify(globals.audioFile) : "undefined"};`,
			);
			lines.push(
				`export const resolvedTiming = ${globals.resolvedTiming !== undefined ? JSON.stringify(globals.resolvedTiming) : "undefined"};`,
			);
			lines.push(
				`export const voiceoverNone = ${globals.voiceoverNone !== undefined ? JSON.stringify(globals.voiceoverNone) : "undefined"};`,
			);
			lines.push(
				`export const renderFps = ${globals.renderFps !== undefined ? JSON.stringify(globals.renderFps) : "undefined"};`,
			);
			return `${lines.join("\n")}\n`;
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
export function segmentDiscoveryPlugin(consumerRoot: string): Plugin {
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

			const invalidate = () => {
				const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_SEGMENTS_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
					server.ws.send({ type: "full-reload" });
				}
			};

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

// ---- Project virtual module plugin ----

const VIRTUAL_PROJECT_ID = "virtual:videowright/project";
const RESOLVED_VIRTUAL_PROJECT_ID = `\0${VIRTUAL_PROJECT_ID}`;

/**
 * Vite plugin that provides a virtual module `virtual:videowright/project`.
 * The module exports the `ProjectInfo` object as a default export so the
 * browser can import it synchronously with no fetch waterfall.
 *
 * When `onReload` is provided, timeline.ts changes trigger a re-discovery
 * and full page reload so the homepage reflects updated metadata.
 */
export function projectVirtualModulePlugin(
	initialProjectInfo: ProjectInfo,
	opts?: {
		consumerRoot: string;
		onReload: () => Promise<ProjectInfo>;
	},
): Plugin {
	let projectInfo = initialProjectInfo;

	return {
		name: "videowright-project-info",
		resolveId(id) {
			if (id === VIRTUAL_PROJECT_ID) return RESOLVED_VIRTUAL_PROJECT_ID;
		},
		load(id) {
			if (id !== RESOLVED_VIRTUAL_PROJECT_ID) return;
			return `export default ${JSON.stringify(projectInfo)};`;
		},
		configureServer(server: ViteDevServer) {
			if (!opts) return;

			const videosDir = join(opts.consumerRoot, "videos");
			const reload = async () => {
				projectInfo = await opts.onReload();
				const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_PROJECT_ID);
				if (mod) {
					server.moduleGraph.invalidateModule(mod);
				}
				server.ws.send({ type: "full-reload" });
			};

			const onTimelineChange = (path: string) => {
				if (path.endsWith("timeline.ts") && path.includes(`${videosDir}/`)) {
					reload();
				}
			};

			server.watcher.add(videosDir);
			server.watcher.on("change", onTimelineChange);
			server.watcher.on("add", onTimelineChange);
			server.watcher.on("unlink", onTimelineChange);
		},
	};
}

// ---- SPA history fallback plugin ----

/** Paths that should never be rewritten by the SPA fallback. */
const VITE_INTERNAL_PREFIXES = ["/@vite/", "/@fs/", "/@id/", "/node_modules/", "/__vite"];

/**
 * Vite plugin that implements SPA history fallback for the dev server.
 * Rewrites GET requests for non-asset paths to `/` so that Vite serves
 * index.html, enabling client-side routing via the History API.
 */
export function spaFallbackPlugin(): Plugin {
	return {
		name: "videowright-spa-fallback",
		configureServer(server: ViteDevServer) {
			// Return a function so the middleware runs AFTER Vite's built-in
			// static serving and transform middleware. This ensures that actual
			// files (JS, CSS, images) are served normally, and only unmatched
			// paths fall through to the rewrite.
			return () => {
				const middleware: Connect.NextHandleFunction = (req, _res, next) => {
					if (!req.url || req.method !== "GET") {
						next();
						return;
					}

					const url = req.url.split("?")[0];

					// Skip render.html (Playwright render entry)
					if (url === "/render.html") {
						next();
						return;
					}

					// Skip paths with file extensions (static assets)
					if (extname(url)) {
						next();
						return;
					}

					// Skip Vite internal paths
					for (const prefix of VITE_INTERNAL_PREFIXES) {
						if (url.startsWith(prefix)) {
							next();
							return;
						}
					}

					// Rewrite to root so Vite serves index.html
					req.url = "/";
					next();
				};

				server.middlewares.use(middleware);
			};
		},
	};
}
