/**
 * `videowright script` — load a timeline and segments in Node, produce the
 * voiceover script as Markdown.
 */

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { script } from "../script/script.js";
import type { SegmentLoaderMap } from "../timeline/index.js";
import type { Segment, Timeline } from "../types.js";
import { discoverProject } from "./discover_project.js";
import { loadModule } from "./ts_loader.js";

export interface ScriptOptions {
	cwd: string;
	positional?: string;
	write?: boolean;
	verbose?: boolean;
}

export interface ScriptResult {
	markdown: string;
	writtenTo?: string;
}

/**
 * Build a SegmentLoaderMap by walking the cwd/segments/ directory in Node.
 * Each segments/<id>/index.ts becomes an entry in the map.
 * Directories without an index.ts are warned about.
 */
export function buildNodeSegmentLoaderMap(cwd: string): SegmentLoaderMap {
	const segmentsDir = join(cwd, "segments");
	const map: SegmentLoaderMap = new Map();

	if (!existsSync(segmentsDir)) return map;

	let entries: string[];
	try {
		entries = readdirSync(segmentsDir);
	} catch {
		return map;
	}

	const skipped: string[] = [];

	for (const entry of entries) {
		const entryPath = join(segmentsDir, entry);
		// Only consider directories
		try {
			if (!statSync(entryPath).isDirectory()) continue;
		} catch {
			continue;
		}

		const indexPath = join(entryPath, "index.ts");
		if (existsSync(indexPath)) {
			const absPath = resolve(indexPath);
			map.set(entry, async () => {
				const mod = await loadModule(absPath);
				return { default: mod.default as Segment };
			});
		} else {
			skipped.push(entry);
		}
	}

	if (skipped.length > 0) {
		console.warn(
			`buildNodeSegmentLoaderMap: skipped directories without index.ts: ${skipped.join(", ")}`,
		);
	}

	return map;
}

/**
 * Run the script flow. Returns the markdown and optional write path.
 */
export async function runScript(opts: ScriptOptions): Promise<ScriptResult> {
	const { cwd, positional, write, verbose } = opts;

	const { configPath, timelinePath } = discoverProject(cwd, positional, "script");

	if (verbose) {
		console.log(`config: ${configPath}`);
		console.log(`timeline: ${timelinePath}`);
	}

	// 3. Load config + timeline (config loaded to validate; not used directly here)
	await loadModule(configPath);

	const timelineMod = await loadModule(timelinePath);
	const timeline = timelineMod.default as Timeline;

	// 4. Build segment loader map from filesystem
	const segmentLoaders = buildNodeSegmentLoaderMap(cwd);

	// 5. Generate script
	const markdown = await script(timeline, segmentLoaders);

	// 6. Write or return
	let writtenTo: string | undefined;
	if (write) {
		// Infer video folder from timeline path: parent dir of timeline.ts
		const videoDir = dirname(timelinePath);
		const voiceoverDir = join(videoDir, "voiceover");
		if (!existsSync(voiceoverDir)) {
			mkdirSync(voiceoverDir, { recursive: true });
		}
		const outputPath = join(voiceoverDir, "script.md");
		writeFileSync(outputPath, markdown, "utf-8");
		writtenTo = outputPath;
	}

	return { markdown, writtenTo };
}
