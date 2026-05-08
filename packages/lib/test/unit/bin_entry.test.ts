import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("bin entry", () => {
	it("bin.ts starts with shebang", () => {
		const binPath = resolve(__dirname, "../../src/cli/bin.ts");
		const content = readFileSync(binPath, "utf-8");
		expect(content.startsWith("#!/usr/bin/env node")).toBe(true);
	});

	it("bin.ts imports and calls main", () => {
		const binPath = resolve(__dirname, "../../src/cli/bin.ts");
		const content = readFileSync(binPath, "utf-8");
		expect(content).toContain('import { main } from "./index.js"');
		expect(content).toContain("main()");
	});

	it("index.ts does NOT contain auto-run guard", () => {
		const indexPath = resolve(__dirname, "../../src/cli/index.ts");
		const content = readFileSync(indexPath, "utf-8");
		expect(content).not.toContain("process.argv[1]");
		expect(content).not.toContain("isBinEntry");
		expect(content).not.toContain("isDirectRun");
	});
});
