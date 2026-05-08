import { existsSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findConfig, findTimeline } from "../../src/cli/discover.js";
import { UserError } from "../../src/cli/errors.js";

let tmpDir: string;

function makeTmpDir(): string {
	const dir = join(
		process.env.TMPDIR ?? "/tmp",
		`vw-discover-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

describe("findConfig", () => {
	it("discover_config_present", () => {
		writeFileSync(join(tmpDir, "videowright.config.ts"), "export default {};", "utf-8");
		const result = findConfig(tmpDir);
		expect(result).not.toBeNull();
		expect(result).toContain("videowright.config.ts");
		expect(result).toContain(tmpDir);
	});

	it("discover_config_absent", () => {
		const result = findConfig(tmpDir);
		expect(result).toBeNull();
	});
});

describe("findTimeline", () => {
	it("discover_timeline_explicit_hint", () => {
		const videoDir = join(tmpDir, "videos", "demo");
		mkdirSync(videoDir, { recursive: true });
		const timelinePath = join(videoDir, "timeline.ts");
		writeFileSync(timelinePath, "export default {};", "utf-8");

		const result = findTimeline(tmpDir, "videos/demo/timeline.ts");
		expect(result).not.toBeNull();
		expect(result).toContain("timeline.ts");
	});

	it("discover_timeline_explicit_hint_missing_throws", () => {
		expect(() => findTimeline(tmpDir, "videos/nope/timeline.ts")).toThrow(UserError);
		try {
			findTimeline(tmpDir, "videos/nope/timeline.ts");
		} catch (e) {
			const err = e as UserError;
			expect(err.message).toContain("Timeline not found");
			expect(err.hint).toContain("Check that the file exists");
		}
	});

	it("discover_timeline_picks_most_recent", () => {
		// Create three video dirs with timelines at different mtimes
		const names = ["alpha", "beta", "gamma"];
		const baseTimes = [
			new Date("2025-01-01"),
			new Date("2025-06-01"), // newest
			new Date("2025-03-01"),
		];

		for (let i = 0; i < names.length; i++) {
			const videoDir = join(tmpDir, "videos", names[i]);
			mkdirSync(videoDir, { recursive: true });
			const timelinePath = join(videoDir, "timeline.ts");
			writeFileSync(timelinePath, `// ${names[i]}`, "utf-8");
			// Set atime and mtime
			const t = baseTimes[i].getTime() / 1000;
			utimesSync(timelinePath, t, t);
		}

		const result = findTimeline(tmpDir);
		expect(result).not.toBeNull();
		expect(result).toContain("beta");
	});

	it("discover_timeline_no_videos_dir", () => {
		const result = findTimeline(tmpDir);
		expect(result).toBeNull();
	});

	it("discover_timeline_no_videos", () => {
		mkdirSync(join(tmpDir, "videos"), { recursive: true });
		const result = findTimeline(tmpDir);
		expect(result).toBeNull();
	});

	it("discover_timeline_empty_video_dirs", () => {
		// Video dirs exist but have no timeline.ts
		mkdirSync(join(tmpDir, "videos", "alpha"), { recursive: true });
		mkdirSync(join(tmpDir, "videos", "beta"), { recursive: true });
		const result = findTimeline(tmpDir);
		expect(result).toBeNull();
	});
});
