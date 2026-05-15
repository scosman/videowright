import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findAllTimelines } from "../../src/cli/discover.js";

let tmpDir: string;

function makeTmpDir(): string {
	const dir = join(
		process.env.TMPDIR ?? "/tmp",
		`vw-discover-all-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	mkdirSync(dir, { recursive: true });
	return dir;
}

beforeEach(() => {
	tmpDir = makeTmpDir();
});

afterEach(() => {
	if (tmpDir && existsSync(tmpDir)) {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});

describe("findAllTimelines", () => {
	it("findAllTimelines_empty_videos", () => {
		// No videos/ directory at all
		const result = findAllTimelines(tmpDir);
		expect(result).toEqual([]);
	});

	it("findAllTimelines_empty_videos_dir", () => {
		// videos/ exists but is empty
		mkdirSync(join(tmpDir, "videos"), { recursive: true });
		const result = findAllTimelines(tmpDir);
		expect(result).toEqual([]);
	});

	it("findAllTimelines_single_video", () => {
		const videoDir = join(tmpDir, "videos", "demo");
		mkdirSync(videoDir, { recursive: true });
		writeFileSync(join(videoDir, "timeline.ts"), "export default {};", "utf-8");

		const result = findAllTimelines(tmpDir);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(resolve(videoDir, "timeline.ts"));
	});

	it("findAllTimelines_multiple_videos", () => {
		const names = ["alpha", "beta", "gamma"];
		for (const name of names) {
			const videoDir = join(tmpDir, "videos", name);
			mkdirSync(videoDir, { recursive: true });
			writeFileSync(join(videoDir, "timeline.ts"), `// ${name}`, "utf-8");
		}

		const result = findAllTimelines(tmpDir);
		expect(result).toHaveLength(3);
		// All should be absolute paths
		for (const p of result) {
			expect(p).toContain("timeline.ts");
			expect(p).toContain(tmpDir);
		}
	});

	it("findAllTimelines_ignores_files_not_dirs", () => {
		mkdirSync(join(tmpDir, "videos"), { recursive: true });
		// A regular file in videos/ (not a directory)
		writeFileSync(join(tmpDir, "videos", "readme.txt"), "hello", "utf-8");
		// A proper video dir
		const videoDir = join(tmpDir, "videos", "demo");
		mkdirSync(videoDir, { recursive: true });
		writeFileSync(join(videoDir, "timeline.ts"), "export default {};", "utf-8");

		const result = findAllTimelines(tmpDir);
		expect(result).toHaveLength(1);
	});

	it("findAllTimelines_ignores_dirs_without_timeline", () => {
		// A directory without timeline.ts
		mkdirSync(join(tmpDir, "videos", "empty_dir"), { recursive: true });
		// A directory with timeline.ts
		const videoDir = join(tmpDir, "videos", "demo");
		mkdirSync(videoDir, { recursive: true });
		writeFileSync(join(videoDir, "timeline.ts"), "export default {};", "utf-8");

		const result = findAllTimelines(tmpDir);
		expect(result).toHaveLength(1);
		expect(result[0]).toContain("demo");
	});
});
