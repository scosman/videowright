import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildNodeSegmentLoaderMap, runScript } from "../../src/cli/script_cmd.js";

let tmpDir: string;

function makeTmpDir(): string {
	const dir = join(
		process.env.TMPDIR ?? "/tmp",
		`vw-cli-script-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	mkdirSync(dir, { recursive: true });
	return dir;
}

/**
 * Scaffold a minimal consumer repo structure in tmpDir.
 */
function scaffoldFixture(tmpRoot: string) {
	// Config
	writeFileSync(
		join(tmpRoot, "videowright.config.ts"),
		`export default { projectStructure: "v1" };`,
		"utf-8",
	);

	// Timeline
	const videoDir = join(tmpRoot, "videos", "demo");
	mkdirSync(videoDir, { recursive: true });
	writeFileSync(
		join(videoDir, "timeline.ts"),
		`export default {
	meta: { title: "Demo Video" },
	segments: [{ id: "intro" }, { id: "outro" }],
};`,
		"utf-8",
	);

	// Segments
	const introDir = join(tmpRoot, "segments", "intro");
	mkdirSync(introDir, { recursive: true });
	writeFileSync(
		join(introDir, "index.ts"),
		`export default {
	id: "intro",
	voiceover: "Welcome to the demo.",
	async play() {},
};`,
		"utf-8",
	);

	const outroDir = join(tmpRoot, "segments", "outro");
	mkdirSync(outroDir, { recursive: true });
	writeFileSync(
		join(outroDir, "index.ts"),
		`export default {
	id: "outro",
	voiceover: "Thanks for watching.",
	async play() {},
};`,
		"utf-8",
	);
}

beforeEach(() => {
	tmpDir = makeTmpDir();
});

afterEach(() => {
	if (tmpDir && existsSync(tmpDir)) {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});

describe("buildNodeSegmentLoaderMap", () => {
	it("builds map from segments directory", () => {
		scaffoldFixture(tmpDir);
		const map = buildNodeSegmentLoaderMap(tmpDir);
		expect(map.size).toBe(2);
		expect(map.has("intro")).toBe(true);
		expect(map.has("outro")).toBe(true);
	});

	it("returns empty map when segments dir missing", () => {
		const map = buildNodeSegmentLoaderMap(tmpDir);
		expect(map.size).toBe(0);
	});
});

describe("runScript", () => {
	it("cli_script_against_fixture", async () => {
		scaffoldFixture(tmpDir);

		const result = await runScript({
			cwd: tmpDir,
		});

		expect(result.markdown).toContain("# Demo Video");
		expect(result.markdown).toContain("## intro");
		expect(result.markdown).toContain("Welcome to the demo.");
		expect(result.markdown).toContain("## outro");
		expect(result.markdown).toContain("Thanks for watching.");
		expect(result.writtenTo).toBeUndefined();
	});

	it("cli_script_write_creates_file", async () => {
		scaffoldFixture(tmpDir);

		const result = await runScript({
			cwd: tmpDir,
			write: true,
		});

		expect(result.writtenTo).not.toBeUndefined();
		const expectedPath = join(tmpDir, "videos", "demo", "voiceover", "script.md");
		expect(result.writtenTo).toBe(expectedPath);
		expect(existsSync(expectedPath)).toBe(true);

		const content = readFileSync(expectedPath, "utf-8");
		expect(content).toContain("# Demo Video");
		expect(content).toContain("Welcome to the demo.");
	});

	it("cli_script_with_explicit_path", async () => {
		scaffoldFixture(tmpDir);

		const result = await runScript({
			cwd: tmpDir,
			positional: "videos/demo/timeline.ts",
		});

		expect(result.markdown).toContain("# Demo Video");
	});
});
