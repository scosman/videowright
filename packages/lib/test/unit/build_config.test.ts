import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PKG_ROOT = resolve(import.meta.dirname, "../..");

function readJson<T>(file: string): T {
	return JSON.parse(readFileSync(resolve(PKG_ROOT, file), "utf-8")) as T;
}

const { outDir, tsBuildInfoFile } = readJson<{
	compilerOptions: { outDir: string; tsBuildInfoFile?: string };
}>("tsconfig.json").compilerOptions;

describe("lib build config", () => {
	// tsc --build trusts the tsbuildinfo alone. If it outlives a deleted dist/,
	// the build is skipped and every source file fails with TS6305.
	it("keeps the tsbuildinfo inside outDir, so deleting dist/ forces a rebuild", () => {
		expect(tsBuildInfoFile).toBeDefined();
		const buildInfoPath = resolve(PKG_ROOT, tsBuildInfoFile as string);
		expect(relative(resolve(PKG_ROOT, outDir), buildInfoPath)).not.toMatch(/^\.\./);
	});

	it("leaves the tsbuildinfo out of the published package", () => {
		const { files } = readJson<{ files: string[] }>("package.json");
		expect(files).toContain(`!${tsBuildInfoFile}`);
	});
});
