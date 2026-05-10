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

	it("references/ has the expected files", () => {
		const refsDir = resolve(SKILL_ROOT, "references");
		expect(existsSync(refsDir)).toBe(true);

		const files = readdirSync(refsDir).sort();
		expect(files).toEqual([
			"authoring_segment.md",
			"create_or_edit_video.md",
			"dev_server.md",
			"export.md",
			"new_video.md",
			"project_structure.md",
			"setup.md",
			"setup_new_style.md",
			"styles.md",
			"testing.md",
			"types.md",
			"voiceover",
			"voiceover.md",
		]);
	});

	it("references/voiceover/ has the expected sub-references", () => {
		const voDir = resolve(SKILL_ROOT, "references/voiceover");
		expect(existsSync(voDir)).toBe(true);

		const files = readdirSync(voDir).sort();
		expect(files).toEqual([
			"animation_sync.md",
			"provider_script.md",
			"providers",
			"script_writing.md",
			"style_intake.md",
			"sync_algorithm.md",
		]);

		const providerFiles = readdirSync(resolve(voDir, "providers")).sort();
		expect(providerFiles).toEqual(["elevenlabs.md", "manual.md"]);
	});

	it("hello_world has timeline as a plain reference file", () => {
		const timeline = resolve(SKILL_ROOT, "assets/hello_world/timeline.ts");
		expect(existsSync(timeline)).toBe(true);

		const content = readFileSync(timeline, "utf-8");
		expect(content).toContain("Timeline");
		expect(content).toContain("segments");
		// No template placeholders
		expect(content).not.toContain("{{");
	});

	it("hello_world has segment reference files", () => {
		const segDir = resolve(SKILL_ROOT, "assets/hello_world/segments");
		expect(existsSync(segDir)).toBe(true);

		const files = readdirSync(segDir).sort();
		expect(files).toEqual(["hello_intro.ts", "hello_outro.ts"]);
	});

	it("hello_world has README and PLAN as plain reference files", () => {
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/README.md"))).toBe(true);
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md"))).toBe(true);
		// No .tmpl versions should exist
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/README.md.tmpl"))).toBe(false);
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md.tmpl"))).toBe(false);
	});

	it("hello_world has voiceover script as a plain reference file", () => {
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/voiceover/script.md"))).toBe(true);
		// No .tmpl version should exist
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/voiceover/script.md.tmpl"))).toBe(
			false,
		);
	});

	it("timeline.ts imports style tokens via top-of-file CSS import", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/timeline.ts"), "utf-8");
		// The style import convention: first line imports tokens.css
		expect(content).toMatch(/^import\s+["'].*tokens\.css["']/);
		expect(content).toContain("styles/placeholder/tokens.css");
	});

	it("hello_intro.ts uses only the 6 recommended style tokens", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_intro.ts"),
			"utf-8",
		);
		expect(content).toContain("var(--color-bg)");
		expect(content).toContain("var(--font-display)");
		// No template placeholders
		expect(content).not.toContain("{{");
		// Only uses the 6 recommended tokens — no extended tokens
		const varRefs = content.match(/var\(--[\w-]+\)/g) ?? [];
		const recommended = new Set([
			"--color-bg",
			"--color-fg",
			"--color-accent",
			"--font-display",
			"--font-body",
			"--font-mono",
		]);
		for (const ref of varRefs) {
			const token = ref.match(/var\((--[\w-]+)\)/)?.[1] ?? ref;
			expect(
				recommended.has(token),
				`Unexpected extended token ${token} -- use only the 6 recommended tokens`,
			).toBe(true);
		}
	});

	it("hello_outro.ts uses only the 6 recommended style tokens", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_outro.ts"),
			"utf-8",
		);
		expect(content).toContain("var(--color-bg)");
		expect(content).toContain("var(--font-display)");
		expect(content).toContain("defineSegment");
		// No template placeholders
		expect(content).not.toContain("{{");
		// Only uses the 6 recommended tokens — no extended tokens
		const varRefs = content.match(/var\(--[\w-]+\)/g) ?? [];
		const recommended = new Set([
			"--color-bg",
			"--color-fg",
			"--color-accent",
			"--font-display",
			"--font-body",
			"--font-mono",
		]);
		for (const ref of varRefs) {
			const token = ref.match(/var\((--[\w-]+)\)/)?.[1] ?? ref;
			expect(
				recommended.has(token),
				`Unexpected extended token ${token} -- use only the 6 recommended tokens`,
			).toBe(true);
		}
	});

	it("PLAN.md is a concrete reference with no template placeholders", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md"), "utf-8");
		expect(content).toContain("# Plan:");
		expect(content).toContain("## Log");
		expect(content).not.toContain("{{");
	});

	it("README.md is a concrete reference with no template placeholders", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/README.md"), "utf-8");
		expect(content).toContain("Videowright");
		expect(content).not.toContain("{{");
	});

	it("voiceover/script.md is a concrete reference with no template placeholders", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/voiceover/script.md"),
			"utf-8",
		);
		expect(content).toContain("hello-intro");
		expect(content).not.toContain("{{");
	});

	it("SKILL.md reference paths resolve to existing files", () => {
		const skillMd = readFileSync(resolve(SKILL_ROOT, "SKILL.md"), "utf-8");

		// Extract all references/...md paths from the markdown
		const refPattern = /references\/[\w_]+\.md/g;
		const matches = skillMd.match(refPattern) ?? [];

		expect(matches.length).toBeGreaterThanOrEqual(10);

		for (const ref of matches) {
			const fullPath = resolve(SKILL_ROOT, ref);
			expect(existsSync(fullPath), `Expected ${ref} to exist`).toBe(true);
		}
	});

	it("segment reference files use defineSegment from videowright", () => {
		const introContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_intro.ts"),
			"utf-8",
		);
		expect(introContent).toContain('import { defineSegment } from "videowright"');
		expect(introContent).toContain("defineSegment(");
		expect(introContent).toContain("waitForNext");

		const outroContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello_outro.ts"),
			"utf-8",
		);
		expect(outroContent).toContain('import { defineSegment } from "videowright"');
		expect(outroContent).toContain("defineSegment(");
	});

	it("timeline reference uses Timeline type from videowright", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/timeline.ts"), "utf-8");
		expect(content).toContain('import type { Timeline } from "videowright"');
		expect(content).toContain("hello-intro");
		expect(content).toContain("hello-outro");
		expect(content).toContain("transition");
	});

	const STYLE_PACKS = ["placeholder", "modern", "retro", "bauhaus", "animated-explainer"] as const;

	const RECOMMENDED_TOKENS = [
		"--color-bg",
		"--color-fg",
		"--color-accent",
		"--font-display",
		"--font-body",
		"--font-mono",
	];

	describe.each(STYLE_PACKS)("style pack: %s", (packName) => {
		const styleDir = resolve(SKILL_ROOT, `assets/styles/${packName}`);

		it("pack folder exists with required files", () => {
			expect(existsSync(styleDir)).toBe(true);
			expect(existsSync(resolve(styleDir, "STYLE.md"))).toBe(true);
			expect(existsSync(resolve(styleDir, "tokens.css"))).toBe(true);
			expect(existsSync(resolve(styleDir, "sample-segment/index.ts"))).toBe(true);
		});

		it("STYLE.md has required frontmatter fields", () => {
			const content = readFileSync(resolve(styleDir, "STYLE.md"), "utf-8");
			expect(content).toMatch(/^---\n/);
			expect(content).toMatch(/title:/);
			expect(content).toMatch(new RegExp(`slug:\\s*${packName}`));
			expect(content).toMatch(/picker_description:/);
			expect(content).toMatch(/font_sources:/);
		});

		it("tokens.css defines the 6 recommended tokens", () => {
			const content = readFileSync(resolve(styleDir, "tokens.css"), "utf-8");
			for (const token of RECOMMENDED_TOKENS) {
				expect(content, `Missing token ${token} in tokens.css`).toContain(`${token}:`);
			}
		});

		it("sample-segment uses defineSegment, voiceover, waitForNext, and references recommended tokens", () => {
			const content = readFileSync(resolve(styleDir, "sample-segment/index.ts"), "utf-8");
			expect(content).toContain("defineSegment");
			expect(content).toContain("voiceover");
			expect(content).toContain("waitForNext");

			// Must reference at least one CSS var from the 6 recommended tokens
			const varRefs = content.match(/var\(--[\w-]+\)/g) ?? [];
			const recommendedSet = new Set(RECOMMENDED_TOKENS);
			const usedRecommended = varRefs.filter((ref) => {
				const token = ref.match(/var\((--[\w-]+)\)/)?.[1] ?? "";
				return recommendedSet.has(token);
			});
			expect(
				usedRecommended.length,
				"sample-segment/index.ts must reference at least one CSS var from the 6 recommended tokens",
			).toBeGreaterThanOrEqual(1);
		});

		it("sample-segment imports nothing from outside its own pack folder", () => {
			const content = readFileSync(resolve(styleDir, "sample-segment/index.ts"), "utf-8");
			const imports = content.match(/from\s+["']([^"']+)["']/g) ?? [];
			for (const imp of imports) {
				const path = imp.match(/from\s+["']([^"']+)["']/)?.[1] ?? "";
				expect(
					path === "videowright" || path.startsWith("./") || path.startsWith("../"),
					`Import "${path}" should be from "videowright" or a relative path within the pack`,
				).toBe(true);
				if (path.startsWith("../")) {
					expect(
						!path.startsWith("../../"),
						`Import "${path}" escapes the ${packName} pack folder`,
					).toBe(true);
				}
			}
		});
	});
});
