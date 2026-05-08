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
});
