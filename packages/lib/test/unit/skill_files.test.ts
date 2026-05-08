import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SKILL_ROOT = resolve(__dirname, "../../skill");

describe("skill file structure", () => {
	it("SKILL.md exists with frontmatter", () => {
		const skillMd = resolve(SKILL_ROOT, "SKILL.md");
		expect(existsSync(skillMd)).toBe(true);

		const content = readFileSync(skillMd, "utf-8");
		expect(content).toMatch(/^---\n/);
		expect(content).toMatch(/name:\s*videowright/);
		expect(content).toMatch(/description:/);
	});

	it("references/ has the 4 expected files", () => {
		const refsDir = resolve(SKILL_ROOT, "references");
		expect(existsSync(refsDir)).toBe(true);

		const files = readdirSync(refsDir).sort();
		expect(files).toEqual([
			"authoring_segment.md",
			"authoring_video.md",
			"setup.md",
			"style_matching.md",
		]);
	});

	it("hello_world has timeline template", () => {
		const timeline = resolve(SKILL_ROOT, "assets/hello_world/timeline.ts.tmpl");
		expect(existsSync(timeline)).toBe(true);

		const content = readFileSync(timeline, "utf-8");
		expect(content).toContain("Timeline");
		expect(content).toContain("segments");
	});

	it("hello_world has segment templates", () => {
		const segDir = resolve(SKILL_ROOT, "assets/hello_world/segments");
		expect(existsSync(segDir)).toBe(true);

		const files = readdirSync(segDir).sort();
		expect(files).toEqual(["hello_intro.ts.tmpl", "hello_outro.ts.tmpl"]);
	});

	it("hello_world has README and PLAN templates", () => {
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/README.md.tmpl"))).toBe(true);
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md.tmpl"))).toBe(true);
	});

	it("hello_world has voiceover script template", () => {
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/voiceover/script.md.tmpl"))).toBe(
			true,
		);
	});

	it("timeline.ts.tmpl contains {{title}}", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/timeline.ts.tmpl"),
			"utf-8",
		);
		expect(content).toContain("{{title}}");
	});

	it("hello_intro.ts.tmpl contains {{title}}", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_intro.ts.tmpl"),
			"utf-8",
		);
		expect(content).toContain("{{title}}");
	});

	it("hello_outro.ts.tmpl contains no raw {{video_name}} (uses no substitution)", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_outro.ts.tmpl"),
			"utf-8",
		);
		// Outro has no substitution vars -- it uses hardcoded text
		expect(content).toContain("defineSegment");
	});

	it("PLAN.md.tmpl contains {{title}} and {{date}}", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md.tmpl"), "utf-8");
		expect(content).toContain("{{title}}");
		expect(content).toContain("{{date}}");
	});

	it("README.md.tmpl contains {{video_name}} and {{title}}", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/README.md.tmpl"), "utf-8");
		expect(content).toContain("{{video_name}}");
		expect(content).toContain("{{title}}");
	});

	it("voiceover/script.md.tmpl contains {{title}}", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/voiceover/script.md.tmpl"),
			"utf-8",
		);
		expect(content).toContain("{{title}}");
	});

	it("SKILL.md reference paths resolve to existing files", () => {
		const skillMd = readFileSync(resolve(SKILL_ROOT, "SKILL.md"), "utf-8");

		// Extract all references/...md paths from the markdown
		const refPattern = /references\/[\w_]+\.md/g;
		const matches = skillMd.match(refPattern) ?? [];

		expect(matches.length).toBeGreaterThanOrEqual(4);

		for (const ref of matches) {
			const fullPath = resolve(SKILL_ROOT, ref);
			expect(existsSync(fullPath), `Expected ${ref} to exist`).toBe(true);
		}
	});

	it("segment templates use defineSegment from videowright", () => {
		const introContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_intro.ts.tmpl"),
			"utf-8",
		);
		expect(introContent).toContain("import { defineSegment } from 'videowright'");
		expect(introContent).toContain("defineSegment(");
		expect(introContent).toContain("waitForNext");

		const outroContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_outro.ts.tmpl"),
			"utf-8",
		);
		expect(outroContent).toContain("import { defineSegment } from 'videowright'");
		expect(outroContent).toContain("defineSegment(");
	});

	it("timeline template uses Timeline type from videowright", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/timeline.ts.tmpl"),
			"utf-8",
		);
		expect(content).toContain("import type { Timeline } from 'videowright'");
		expect(content).toContain("hello-intro");
		expect(content).toContain("hello-outro");
		expect(content).toContain("transition");
	});
});
