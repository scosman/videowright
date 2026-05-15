import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveSlugOrPath } from "../../src/cli/discover.js";
import { discoverAllVideos } from "../../src/cli/discover_project.js";
import { UserError } from "../../src/cli/errors.js";
import { resolveRenderTarget } from "../../src/cli/render.js";
import type { VideoSummary } from "../../src/types.js";

function fakeVideo(slug: string): VideoSummary {
	return {
		slug,
		timelinePath: `/fake/videos/${slug}/timeline.ts`,
		title: `${slug} title`,
		style: "motion-engineering",
		mtimeMs: Date.now(),
	};
}

let tmpDir: string;

function makeTmpDir(): string {
	const dir = join(
		process.env.TMPDIR ?? "/tmp",
		`vw-render-disc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	mkdirSync(dir, { recursive: true });
	return dir;
}

function writeConfig(root: string): void {
	writeFileSync(join(root, "videowright.config.ts"), "export default {};", "utf-8");
}

function writeVideo(root: string, slug: string): string {
	const videoDir = join(root, "videos", slug);
	mkdirSync(videoDir, { recursive: true });
	const timelinePath = join(videoDir, "timeline.ts");
	writeFileSync(
		timelinePath,
		`export default { meta: { title: "${slug} title" }, segments: [] };`,
		"utf-8",
	);
	return resolve(timelinePath);
}

beforeEach(() => {
	tmpDir = makeTmpDir();
});

afterEach(() => {
	if (tmpDir && existsSync(tmpDir)) {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});

describe("render discovery: slug resolution", () => {
	it("render_slug_arg_resolves", () => {
		writeConfig(tmpDir);
		writeVideo(tmpDir, "demo");

		const result = resolveSlugOrPath("demo", tmpDir);
		expect(result).not.toBeNull();
		expect(result).toContain("demo");
		expect(result).toContain("timeline.ts");
	});

	it("render_bad_slug_returns_null", () => {
		writeConfig(tmpDir);
		const result = resolveSlugOrPath("nonexistent", tmpDir);
		expect(result).toBeNull();
	});

	it("render_path_arg_resolves", () => {
		writeConfig(tmpDir);
		const timelinePath = writeVideo(tmpDir, "demo");

		const result = resolveSlugOrPath("videos/demo/timeline.ts", tmpDir);
		expect(result).toBe(timelinePath);
	});
});

describe("render discovery: zero/one/many branching", () => {
	it("render_zero_videos_detected", async () => {
		writeConfig(tmpDir);
		const project = await discoverAllVideos(tmpDir);
		expect(project.videos).toHaveLength(0);
	});

	it("render_one_video_auto_pick", async () => {
		writeConfig(tmpDir);
		writeVideo(tmpDir, "only_video");

		const project = await discoverAllVideos(tmpDir);
		expect(project.videos).toHaveLength(1);
		expect(project.videos[0].slug).toBe("only_video");
		expect(project.videos[0].timelinePath).toContain("only_video");
	});

	it("render_many_videos_listed", async () => {
		writeConfig(tmpDir);
		writeVideo(tmpDir, "alpha");
		writeVideo(tmpDir, "beta");
		writeVideo(tmpDir, "gamma");

		const project = await discoverAllVideos(tmpDir);
		expect(project.videos).toHaveLength(3);
	});
});

describe("resolveRenderTarget", () => {
	it("resolveRenderTarget_zero_videos_throws", async () => {
		const project = { videos: [] as VideoSummary[] };
		await expect(resolveRenderTarget(project, true)).rejects.toThrow(UserError);
		await expect(resolveRenderTarget(project, true)).rejects.toThrow("No videos found");
	});

	it("resolveRenderTarget_one_video_auto_picks", async () => {
		const project = { videos: [fakeVideo("demo")] };
		const result = await resolveRenderTarget(project, false);
		expect(result).toBe("/fake/videos/demo/timeline.ts");
	});

	it("resolveRenderTarget_many_videos_non_tty_throws_with_slugs", async () => {
		const project = {
			videos: [fakeVideo("alpha"), fakeVideo("beta"), fakeVideo("gamma")],
		};
		await expect(resolveRenderTarget(project, false)).rejects.toThrow(UserError);
		try {
			await resolveRenderTarget(project, false);
		} catch (e) {
			const err = e as UserError;
			expect(err.message).toContain("Multiple videos found");
			expect(err.message).toContain("npx videowright render alpha");
			expect(err.message).toContain("npx videowright render beta");
			expect(err.message).toContain("npx videowright render gamma");
		}
	});

	it("resolveRenderTarget_one_video_non_tty_still_auto_picks", async () => {
		const project = { videos: [fakeVideo("only")] };
		// Single video should auto-pick even on non-TTY
		const result = await resolveRenderTarget(project, false);
		expect(result).toBe("/fake/videos/only/timeline.ts");
	});
});
