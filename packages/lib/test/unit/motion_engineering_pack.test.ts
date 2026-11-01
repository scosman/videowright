import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The upgraded motion-engineering pack: font bundling, token compatibility, the legibility
// floor, and the demo project's copy staying in sync with the pack (the source of truth).

const PACK = resolve(__dirname, "../../skill/assets/styles/motion-engineering");
const DEMO = resolve(__dirname, "../../../../examples/videowright_demo");
const DEMO_STYLE = resolve(DEMO, "styles/motion-engineering");

const SAMPLES = [
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
];
const KIT_END = "// ── Scene";

// Every token name the pre-upgrade pack defined. Segments and styles may rely on any of them.
const LEGACY_TOKENS = [
	"--color-bg",
	"--color-fg",
	"--color-accent",
	"--color-muted",
	"--color-border",
	"--color-surface",
	"--font-display",
	"--font-body",
	"--font-mono",
	"--space-sm",
	"--space-md",
	"--space-lg",
	"--space-xl",
	"--duration-fast",
	"--duration-normal",
	"--duration-slow",
	"--radius-sm",
	"--radius-md",
	"--stagger",
	"--ease-out",
	"--ease-in",
	"--rule-weight",
	"--scene-hold",
	"--safe-x",
	"--safe-y",
	"--cyan",
	"--warn",
	"--grid-line",
];

const read = (path: string) => readFileSync(path, "utf-8");
const tokens = read(resolve(PACK, "tokens.css"));
const sampleSource = (scene: string) => read(resolve(PACK, `sample/${scene}.ts`));
const scenesHtml = read(resolve(PACK, "reference/scenes.html"));
const animationsJsx = read(resolve(PACK, "reference/animations.jsx"));

describe("motion-engineering pack", () => {
	it("defines every legacy token name", () => {
		for (const name of LEGACY_TOKENS) {
			expect(tokens, `missing ${name}`).toMatch(new RegExp(`^\\s*${name}:`, "m"));
		}
	});

	it("every relative url in tokens.css resolves to a bundled file", () => {
		const urls = [...tokens.matchAll(/url\("(\.\/[^"]+)"\)/g)].map((m) => m[1]);
		expect(urls.filter((u) => u.startsWith("./fonts/")).length).toBeGreaterThanOrEqual(3);
		expect(urls.filter((u) => u.startsWith("./textures/")).length).toBeGreaterThanOrEqual(3);
		for (const url of urls) {
			expect(existsSync(resolve(PACK, url)), url).toBe(true);
		}
	});

	it("every @font-face is a woff2 covered by OFL.txt, with no fallback flash", () => {
		const fontUrls = [...tokens.matchAll(/url\("(\.\/fonts\/[^"]+)"\)/g)].map((m) => m[1]);
		for (const url of fontUrls) expect(url).toMatch(/\.woff2$/);
		const license = read(resolve(PACK, "fonts/OFL.txt"));
		expect(license).toContain("SIL Open Font License");
		for (const file of readdirSync(resolve(PACK, "fonts")).filter((f) => f.endsWith(".woff2"))) {
			expect(license, `OFL.txt does not cover ${file}`).toContain(file);
		}
		expect(tokens).not.toMatch(/font-display:\s*(swap|fallback|optional)/);
	});

	it("font stacks put the bundled faces first, with the symbol supplement", () => {
		const families = [...tokens.matchAll(/font-family:\s*"([^"]+)";/g)].map((m) => m[1]);
		for (const token of ["--font-display", "--font-body", "--font-mono"]) {
			const stack = tokens.match(new RegExp(`${token}:\\s*([^;]+);`))?.[1] ?? "";
			const first = stack.match(/^"([^"]+)"/)?.[1];
			expect(families, `${token} starts with an unbundled face`).toContain(first);
			expect(stack, `${token} lacks the symbol supplement`).toContain('"ME Symbols"');
		}
	});

	it("no font size below the 22px legibility floor", () => {
		const sources = [tokens, ...SAMPLES.map(sampleSource), scenesHtml, animationsJsx];
		// Every way a size can be set: CSS declarations and tokens, SVG attributes, inline
		// style properties, React style objects.
		const declared = sources.flatMap((source) => [
			...source.matchAll(
				/(?:font-size\s*[:=]\s*["']?|--type-[\w-]+:\s*|"font-size":\s*["']?|fontSize\s*[=:]\s*["'`])([^;"'`},\n]+)/g,
			),
		]);
		expect(declared.length).toBeGreaterThan(10);
		for (const [, raw] of declared) {
			const value = raw.trim();
			if (value.startsWith("var(--type-")) continue;
			// Relative units (em, rem, %) can't be checked statically: use px or a --type token.
			const px = value.match(/^(\d+(?:\.\d+)?)px$/);
			expect(px, `font size "${value}" must be px or var(--type-*)`).not.toBeNull();
			expect(Number(px?.[1])).toBeGreaterThanOrEqual(22);
		}
	});

	it("every sample inlines the same kit", () => {
		const kits = SAMPLES.map((scene) => {
			const source = sampleSource(scene);
			expect(source, `${scene} has no "${KIT_END}" marker`).toContain(KIT_END);
			return source.slice(0, source.indexOf(KIT_END));
		});
		for (const [i, kit] of kits.entries()) {
			expect(kit, `sample/${SAMPLES[i]}.ts kit drifted from sample/title.ts`).toBe(kits[0]);
		}
	});

	it("every me-* class the samples and references use is defined in tokens.css", () => {
		const defined = new Set([...tokens.matchAll(/\.(me-[a-z][a-z0-9-]*)/g)].map((m) => m[1]));
		const sources = { "scenes.html": scenesHtml, "animations.jsx": animationsJsx };
		for (const scene of SAMPLES) Object.assign(sources, { [scene]: sampleSource(scene) });
		for (const [name, source] of Object.entries(sources)) {
			const used = [...source.matchAll(/(?<![\w-])(me-[a-z][a-z0-9-]*)/g)].map((m) => m[1]);
			expect(used.length, `${name} uses no me-* classes`).toBeGreaterThan(5);
			for (const cls of new Set(used)) {
				expect(defined, `${name} uses .${cls}, which tokens.css does not define`).toContain(cls);
			}
		}
	});

	// font-display: block hides a missing glyph only until the browser falls back to a system
	// face, which then differs from machine to machine. Every character the pack can put on
	// screen must be in a bundled font.
	it("every non-ASCII character in the samples and references is in a bundled font", () => {
		const allowlist = read(resolve(__dirname, "fixtures/motion_engineering_codepoints.txt"))
			.split("\n")
			.filter((line) => line.trim() && !line.startsWith("#"))
			.map((line) =>
				line
					.trim()
					.split("-")
					.map((hex) => Number.parseInt(hex, 16)),
			);
		const drawable = (cp: number) => allowlist.some(([lo, hi = lo]) => cp >= lo && cp <= hi);
		expect(drawable(0x2713), "the allowlist lost ✓").toBe(true);
		const sources: Record<string, string> = {
			"reference/scenes.html": scenesHtml,
			"reference/animations.jsx": animationsJsx,
		};
		for (const scene of SAMPLES) sources[`sample/${scene}.ts`] = sampleSource(scene);
		for (const [name, source] of Object.entries(sources)) {
			const literal = [...source].map((ch) => ch.codePointAt(0) ?? 0).filter((cp) => cp > 0x7e);
			const entities = [...source.matchAll(/&#(x[0-9a-f]+|\d+);/gi)].map((m) =>
				m[1][0].toLowerCase() === "x" ? Number.parseInt(m[1].slice(1), 16) : Number(m[1]),
			);
			const missing = [...new Set([...literal, ...entities])]
				.filter((cp) => !drawable(cp))
				.map(
					(cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${String.fromCodePoint(cp)}`,
				);
			expect(missing, `${name} uses characters no bundled font draws`).toEqual([]);
		}
	});

	it("scenes.html links the pack's tokens.css and shows all ten scenes", () => {
		expect(scenesHtml).toContain('<link rel="stylesheet" href="../tokens.css">');
		expect(scenesHtml).not.toMatch(/<script/);
		SAMPLES.forEach((scene, i) => {
			const index = `S${String(i + 1).padStart(2, "0")} / 10`;
			expect(scenesHtml, `scenes.html is missing the ${scene} frame`).toContain(index);
		});
	});

	it("animations.jsx is a clock-driven reference of the motion vocabulary", () => {
		for (const name of [
			"useClock",
			"RiseLines",
			"Decode",
			"TickNumber",
			"DrawStroke",
			"CrosshairLock",
			"DimensionLine",
			"LeaderCallout",
			"Release",
			"MotionVocabulary",
		]) {
			expect(animationsJsx).toMatch(new RegExp(`export function ${name}\\b`));
		}
		expect(animationsJsx).not.toMatch(/Math\.random\(/);
	});

	it("the setup picker line matches the pack's picker_description", () => {
		const style = read(resolve(PACK, "STYLE.md"));
		const picker = style.match(/^picker_description:\s*(.+)$/m)?.[1].trim();
		const setup = read(resolve(__dirname, "../../skill/references/setup_new_style.md"));
		expect(picker).toBeTruthy();
		expect(setup).toContain(`- **Motion Engineering** — ${picker}`);
	});

	describe.each(SAMPLES)("sample: %s", (scene) => {
		const source = sampleSource(scene);

		it("awaits font readiness in mount", () => {
			const mount = source.slice(source.indexOf("async mount("));
			expect(mount.slice(0, 200)).toContain("await fontsReady()");
			expect(source).toContain("document.fonts.load(");
		});

		it("stays deterministic: no unseeded randomness or SMIL", () => {
			expect(source).not.toMatch(/Math\.random\(/);
			expect(source).not.toMatch(/<animate/);
		});
	});
});

describe("demo project copy of motion-engineering", () => {
	const syncedFiles = [
		"STYLE.md",
		"brand.md",
		"tokens.css",
		...readdirSync(resolve(PACK, "fonts")).map((f) => `fonts/${f}`),
		...readdirSync(resolve(PACK, "textures")).map((f) => `textures/${f}`),
		...readdirSync(resolve(PACK, "sample")).map((f) => `sample/${f}`),
		...readdirSync(resolve(PACK, "reference")).map((f) => `reference/${f}`),
	];

	it.each(syncedFiles)("%s is byte-identical to the pack", (file) => {
		expect(readFileSync(resolve(DEMO_STYLE, file)).equals(readFileSync(resolve(PACK, file)))).toBe(
			true,
		);
	});

	it.each(readdirSync(resolve(PACK, "sample")).map((f) => f.replace(/\.ts$/, "")))(
		"segments/motion-engineering-sample-%s matches its sample",
		(scene) => {
			const segment = resolve(DEMO, `segments/motion-engineering-sample-${scene}/index.ts`);
			expect(read(segment)).toBe(sampleSource(scene));
		},
	);

	it.each(["demo_video", "blooper_reel"])("%s stays pinned to the frozen legacy style", (video) => {
		const timeline = read(resolve(DEMO, `videos/${video}/timeline.ts`));
		expect(timeline).toContain('import "../../styles/motion-engineering-legacy/tokens.css";');
		expect(timeline).toContain('style: "motion-engineering-legacy"');
		expect(existsSync(resolve(DEMO, "styles/motion-engineering-legacy/tokens.css"))).toBe(true);
	});

	it("STYLE.md transition recipes are the demo's registered transitions", () => {
		const style = read(resolve(PACK, "STYLE.md"));
		const config = read(resolve(DEMO, "videowright.config.ts"));
		for (const name of ["me-sweep", "me-push"]) {
			const file = read(resolve(DEMO, `transitions/${name}.ts`));
			expect(style, `${name} recipe drifted from transitions/${name}.ts`).toContain(
				`\`\`\`ts\n${file}\`\`\``,
			);
			expect(config).toContain(`"${name}": () => import("./transitions/${name}.js")`);
		}
	});
});
