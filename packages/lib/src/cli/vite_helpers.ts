/**
 * Shared Vite helpers used by dev.ts and render.ts.
 * Extracted to avoid coupling dev.ts internals to render.ts.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ViteDevServer } from "vite";

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
