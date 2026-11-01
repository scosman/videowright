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
			"audio",
			"audio.md",
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
		]);
	});

	it("references/audio/ has the expected sub-references", () => {
		const audioDir = resolve(SKILL_ROOT, "references/audio");
		expect(existsSync(audioDir)).toBe(true);

		const files = readdirSync(audioDir).sort();
		expect(files).toEqual([
			"audio_plan.md",
			"build.md",
			"cue_template.md",
			"ffmpeg_cookbook.md",
			"music",
			"sfx",
			"styles.md",
			"sync.md",
			"voiceover",
			"voiceover.md",
		]);
	});

	it("references/audio/voiceover/ has the expected sub-references", () => {
		const voDir = resolve(SKILL_ROOT, "references/audio/voiceover");
		expect(existsSync(voDir)).toBe(true);

		const files = readdirSync(voDir).sort();
		expect(files).toEqual([
			"animation_sync.md",
			"provider_script.md",
			"providers",
			"retime.md",
			"script_writing.md",
			"style_intake.md",
			"sync_algorithm.md",
		]);

		const providerFiles = readdirSync(resolve(voDir, "providers")).sort();
		expect(providerFiles).toEqual(["elevenlabs.md", "gemini.md", "manual.md"]);
	});

	it("references/audio/sfx/ has the expected sub-references", () => {
		const sfxDir = resolve(SKILL_ROOT, "references/audio/sfx");
		expect(existsSync(sfxDir)).toBe(true);

		const files = readdirSync(sfxDir).sort();
		expect(files).toEqual(["providers", "sfx.md"]);

		const providerFiles = readdirSync(resolve(sfxDir, "providers")).sort();
		expect(providerFiles).toEqual(["elevenlabs.md", "manual.md", "openverse.md"]);
	});

	it("references/audio/music/ has the expected sub-references", () => {
		const musicDir = resolve(SKILL_ROOT, "references/audio/music");
		expect(existsSync(musicDir)).toBe(true);

		const files = readdirSync(musicDir).sort();
		expect(files).toEqual(["music.md", "providers"]);

		const providerFiles = readdirSync(resolve(musicDir, "providers")).sort();
		expect(providerFiles).toEqual(["elevenlabs.md", "manual.md", "openverse.md"]);
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

	it("hello_world has segment reference files laid out as segments/<id>/index.ts", () => {
		const segDir = resolve(SKILL_ROOT, "assets/hello_world/segments");
		expect(existsSync(segDir)).toBe(true);

		const folders = readdirSync(segDir).sort();
		expect(folders).toEqual(["hello-intro", "hello-outro"]);
		for (const id of folders) {
			const content = readFileSync(resolve(segDir, id, "index.ts"), "utf-8");
			expect(content).toMatch(new RegExp(`id:\\s*["']${id}["']`));
		}
	});

	it("hello_world has README and PLAN as plain reference files", () => {
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/README.md"))).toBe(true);
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md"))).toBe(true);
		// No .tmpl versions should exist
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/README.md.tmpl"))).toBe(false);
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/PLAN.md.tmpl"))).toBe(false);
	});

	it("hello_world has voiceover script as a plain reference file", () => {
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/voiceover_script/script.md"))).toBe(
			true,
		);
		// No .tmpl version should exist
		expect(
			existsSync(resolve(SKILL_ROOT, "assets/hello_world/voiceover_script/script.md.tmpl")),
		).toBe(false);
	});

	it("timeline.ts imports style tokens via top-of-file CSS import", () => {
		const content = readFileSync(resolve(SKILL_ROOT, "assets/hello_world/timeline.ts"), "utf-8");
		// The style import convention: first line imports tokens.css
		expect(content).toMatch(/^import\s+["'].*tokens\.css["']/);
		expect(content).toContain("styles/editorial-mono/tokens.css");
	});

	it("hello-intro segment uses only the 6 recommended style tokens", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello-intro/index.ts"),
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

	it("hello-outro segment uses only the 6 recommended style tokens", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello-outro/index.ts"),
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

	it("voiceover_script/script.md is a concrete reference with no template placeholders", () => {
		const content = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/voiceover_script/script.md"),
			"utf-8",
		);
		expect(content).toContain("hello-intro");
		expect(content).toContain("editorial-mono-sample-kinetic");
		expect(content).not.toContain("{{");
	});

	it("ships the voiceover retime script", () => {
		expect(existsSync(resolve(SKILL_ROOT, "scripts/retime.mjs"))).toBe(true);
	});

	it("voiceover reference links resolve to existing files and headings", () => {
		const audioDir = resolve(SKILL_ROOT, "references/audio");
		const voDir = resolve(audioDir, "voiceover");
		const docs = [
			resolve(audioDir, "voiceover.md"),
			...readdirSync(voDir)
				.filter((f) => f.endsWith(".md"))
				.map((f) => resolve(voDir, f)),
			...readdirSync(resolve(voDir, "providers")).map((f) => resolve(voDir, "providers", f)),
		];
		// GitHub-style heading anchors.
		const anchors = (file: string) =>
			[...readFileSync(file, "utf-8").matchAll(/^#+ (.+)$/gm)].map((m) =>
				m[1]
					.toLowerCase()
					.replace(/[^a-z0-9 -]/g, "")
					.replace(/ /g, "-"),
			);
		for (const doc of docs) {
			const content = readFileSync(doc, "utf-8");
			for (const [, target] of content.matchAll(/\]\(([^)\s]+)\)/g)) {
				if (/^https?:/.test(target)) continue;
				const [path, anchor] = target.split("#");
				const file = path ? resolve(doc, "..", path) : doc;
				expect(existsSync(file), `${doc}: link ${target}`).toBe(true);
				if (anchor) expect(anchors(file), `${doc}: link ${target}`).toContain(anchor);
			}
		}
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

	it("docs only place segment files at segments/<id>/index.ts", () => {
		// The dev server only discovers segments/<id>/index.ts; a flat
		// segments/<name>.ts file is silently ignored.
		const docs = (readdirSync(SKILL_ROOT, { recursive: true }) as string[]).filter((f) =>
			f.endsWith(".md"),
		);
		expect(docs.length).toBeGreaterThan(10);

		for (const doc of docs) {
			const content = readFileSync(resolve(SKILL_ROOT, doc), "utf-8");
			for (const [path] of content.matchAll(/\bsegments\/[^\s`'")]+\.[jt]s\b/g)) {
				expect(path, `${doc} mentions a segment file outside a segment folder`).toMatch(
					/^segments\/[^/]+\/index\.[jt]s$/,
				);
			}
		}
	});

	it("segment reference files use defineSegment from videowright", () => {
		const introContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello-intro/index.ts"),
			"utf-8",
		);
		expect(introContent).toContain('import { defineSegment } from "videowright"');
		expect(introContent).toContain("defineSegment(");
		expect(introContent).toContain("waitForNext");

		const outroContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/segments/hello-outro/index.ts"),
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

	it("hello_world ships silent with no default_audio_track", () => {
		const timelineContent = readFileSync(
			resolve(SKILL_ROOT, "assets/hello_world/timeline.ts"),
			"utf-8",
		);
		expect(timelineContent).not.toContain("default_audio_track");
		expect(timelineContent).not.toMatch(/audio\/tracks\//);

		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/audio/audio_plan.md"))).toBe(true);
		expect(existsSync(resolve(SKILL_ROOT, "assets/hello_world/audio/tracks"))).toBe(false);
	});

	const STYLE_PACKS = [
		"editorial-mono",
		"swiss-console",
		"neon-terminal",
		"motion-engineering",
		"iso-diagram",
		"risograph",
	] as const;

	const SAMPLE_SCENES = [
		"title",
		"section",
		"kinetic",
		"bullet",
		"stat",
		"feature",
		"grid",
		"ui-showcase",
		"content",
		"cta",
	] as const;

	const RECOMMENDED_TOKENS = [
		"--color-bg",
		"--color-fg",
		"--color-accent",
		"--font-display",
		"--font-body",
		"--font-mono",
	];

	const RECOMMENDED_TOKENS_SET = new Set(RECOMMENDED_TOKENS);

	it("install template package.json exists with required fields", () => {
		const pkgPath = resolve(SKILL_ROOT, "assets/install/package.json");
		expect(existsSync(pkgPath)).toBe(true);

		const content = readFileSync(pkgPath, "utf-8");
		const pkg = JSON.parse(content);
		expect(pkg.type).toBe("module");
		expect(pkg.scripts?.dev).toBeDefined();
		expect(pkg.scripts?.render).toBeDefined();
	});

	it("install template tsconfig.json exists with required fields", () => {
		const tsconfigPath = resolve(SKILL_ROOT, "assets/install/tsconfig.json");
		expect(existsSync(tsconfigPath)).toBe(true);

		const content = readFileSync(tsconfigPath, "utf-8");
		const tsconfig = JSON.parse(content);
		expect(tsconfig.compilerOptions).toBeDefined();
		expect(tsconfig.include).toBeDefined();
		expect(Array.isArray(tsconfig.include)).toBe(true);
	});

	describe("install template env.d.ts", () => {
		const envDts = readFileSync(resolve(SKILL_ROOT, "assets/install/env.d.ts"), "utf-8");
		const install = readFileSync(resolve(SKILL_ROOT, "install/INSTALL.md"), "utf-8");
		const stringAssetPatterns = [
			...envDts.matchAll(
				/declare module "([^"]+)" \{\s*const (\w+): string;\s*export default \2;\s*\}/g,
			),
		].map((m) => m[1]);

		it("declares CSS modules", () => {
			expect(envDts).toContain('declare module "*.css";');
		});

		it("declares image, video, ?raw and ?url imports as a string default export", () => {
			expect(stringAssetPatterns).toEqual([
				"*.png",
				"*.jpg",
				"*.jpeg",
				"*.gif",
				"*.webp",
				"*.svg",
				"*.mp4",
				"*.webm",
				"*?raw",
				"*?url",
			]);
			expect([...envDts.matchAll(/declare module/g)]).toHaveLength(stringAssetPatterns.length + 1);
		});

		it("is wired into the template tsconfig and the install flow", () => {
			const tsconfig = JSON.parse(
				readFileSync(resolve(SKILL_ROOT, "assets/install/tsconfig.json"), "utf-8"),
			);
			expect(tsconfig.include).toContain("env.d.ts");
			expect(install).toContain("node_modules/videowright/skill/assets/install/env.d.ts env.d.ts");
		});

		it("INSTALL.md describes every declared pattern", () => {
			for (const pattern of ["*.css", ...stringAssetPatterns]) {
				expect(install, `INSTALL.md does not mention ${pattern}`).toContain(`\`${pattern}\``);
			}
		});
	});

	describe("setup_new_style.md sample segments", () => {
		const doc = readFileSync(resolve(SKILL_ROOT, "references/setup_new_style.md"), "utf-8");
		const textUnderHeading = (heading: string) => {
			const start = doc.indexOf(`\n${heading}`);
			expect(start, `missing heading ${heading}`).toBeGreaterThanOrEqual(0);
			const body = doc.slice(start + 1 + heading.length);
			const end = body.search(/\n#{2,3} /);
			return heading + (end < 0 ? body : body.slice(0, end));
		};

		it.each(["### Mode 1", "### Mode 3"])(
			"%s drafts samples with the discoverable id and videowright-only imports",
			(heading) => {
				const content = textUnderHeading(heading);
				expect(content).toContain("`id: '<slug>-sample-<scene>'`");
				expect(content).toContain("import only from `videowright`");
			},
		);

		it("the final copy step rewrites relative imports for the segments/ location", () => {
			const content = textUnderHeading("## Final actions");
			expect(content).toMatch(
				/rewrite any relative import so it resolves from `segments\/<slug>-sample-<scene>\/index\.ts`/,
			);
		});

		// A style's tokens.css can load fonts and textures by relative URL; copying only
		// STYLE.md and tokens.css leaves them behind and every sample's mount() fails.
		it("Mode 2 copies the whole style folder, including fonts/ and textures/", () => {
			const content = textUnderHeading("### Mode 2");
			expect(content).toContain(
				"Copy the entire `<source-project>/styles/<slug>/` folder to `styles/<slug>/`",
			);
			expect(content).toContain("`fonts/`");
			expect(content).toContain("`textures/`");
		});

		it("Mode 4 lists fonts/ and textures/ among the copied files", () => {
			const content = textUnderHeading("### Mode 4");
			expect(content).toContain(
				"Copy the entire `node_modules/videowright/skill/assets/styles/<slug>/`",
			);
			expect(content).toContain("`fonts/`");
			expect(content).toContain("`textures/`");
		});

		it("the font_sources edge case does not claim fonts are unbundled", () => {
			const row = doc.split("\n").find((line) => line.startsWith("| `font_sources`"));
			expect(row).toBeDefined();
			expect(row).not.toMatch(/not bundled/);
			expect(row).toContain("styles/<slug>/fonts/");
			expect(row).toContain("@font-face");
		});
	});

	describe.each(STYLE_PACKS)("style pack: %s", (packName) => {
		const styleDir = resolve(SKILL_ROOT, `assets/styles/${packName}`);

		it("pack folder exists with required files", () => {
			expect(existsSync(styleDir)).toBe(true);
			expect(existsSync(resolve(styleDir, "STYLE.md"))).toBe(true);
			expect(existsSync(resolve(styleDir, "tokens.css"))).toBe(true);
			expect(existsSync(resolve(styleDir, "brand.md"))).toBe(true);
			expect(existsSync(resolve(styleDir, "reference/scenes.html"))).toBe(true);
			expect(existsSync(resolve(styleDir, "reference/animations.jsx"))).toBe(true);
			for (const scene of SAMPLE_SCENES) {
				expect(
					existsSync(resolve(styleDir, `sample/${scene}.ts`)),
					`Missing sample/${scene}.ts`,
				).toBe(true);
			}
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

		describe.each(SAMPLE_SCENES)("sample: %s", (scene) => {
			const samplePath = resolve(styleDir, `sample/${scene}.ts`);

			it("uses defineSegment, voiceover, waitForNext, and references recommended tokens", () => {
				const content = readFileSync(samplePath, "utf-8");
				expect(content).toContain("defineSegment");
				expect(content).toContain("voiceover");
				expect(content).toContain("waitForNext");

				const varRefs = content.match(/var\(--[\w-]+\)/g) ?? [];
				const usedRecommended = varRefs.filter((ref) => {
					const token = ref.match(/var\((--[\w-]+)\)/)?.[1] ?? "";
					return RECOMMENDED_TOKENS_SET.has(token);
				});
				expect(
					usedRecommended.length,
					`sample/${scene}.ts must reference at least one CSS var from the 6 recommended tokens`,
				).toBeGreaterThanOrEqual(1);
			});

			it("has id matching <slug>-sample-<scene>", () => {
				const content = readFileSync(samplePath, "utf-8");
				expect(content).toMatch(new RegExp(`id:\\s*["']${packName}-sample-${scene}["']`));
			});

			// Samples are copied to segments/<slug>-sample-<scene>/index.ts, so a
			// relative import would no longer resolve after the copy.
			it("imports only from videowright", () => {
				const content = readFileSync(samplePath, "utf-8");
				// Match statements, not text: a sample may show code such as `from "apogee"` as
				// on-screen content.
				const specifiers = [
					...content.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/gm),
					...content.matchAll(/^\s*import\s*["']([^"']+)["']/gm),
					...content.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
				].map((m) => m[1]);
				expect(specifiers.length).toBeGreaterThan(0);
				for (const specifier of specifiers) {
					expect(specifier, `sample/${scene}.ts may only import "videowright"`).toBe("videowright");
				}
			});
		});
	});
});
