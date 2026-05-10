import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadModule } from "../../src/cli/ts_loader.js";

let tmpDir: string;

function makeTmpDir(): string {
	const dir = join(
		process.env.TMPDIR ?? "/tmp",
		`vw-tsx-debug-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

describe("ts_loader", () => {
	it("loads and unwraps a default export", async () => {
		const testFile = join(tmpDir, "test.ts");
		writeFileSync(testFile, 'export default { meta: { title: "hello" } };', "utf-8");

		const mod = await loadModule(testFile);
		const value = mod.default as { meta: { title: string } };
		expect(value).toBeDefined();
		expect(value.meta).toBeDefined();
		expect(value.meta.title).toBe("hello");
	});

	it("loads a module with both default and named exports", async () => {
		const testFile = join(tmpDir, "mixed.ts");
		writeFileSync(testFile, 'const val = { name: "test" };\nexport default val;', "utf-8");

		const mod = await loadModule(testFile);
		const value = mod.default as { name: string };
		expect(value).toBeDefined();
		expect(value.name).toBe("test");
	});

	it("loads a module that imports a .css file without crashing", async () => {
		// Regression test: consumer timeline.ts files import tokens.css at the
		// top level (e.g. `import '../../styles/modern/tokens.css'`). The CSS is
		// only needed in the browser (Vite handles it). The CLI-side loader must
		// treat these imports as no-ops instead of crashing with
		// ERR_UNKNOWN_FILE_EXTENSION.
		const cssFile = join(tmpDir, "tokens.css");
		writeFileSync(cssFile, ":root { --color-bg: #000; }", "utf-8");

		const testFile = join(tmpDir, "timeline_with_css.ts");
		writeFileSync(
			testFile,
			`import './tokens.css';\nconst t = { meta: { title: 'css-test' }, segments: [] };\nexport default t;`,
			"utf-8",
		);

		const mod = await loadModule(testFile);
		const value = mod.default as { meta: { title: string } };
		expect(value).toBeDefined();
		expect(value.meta.title).toBe("css-test");
	});
});
