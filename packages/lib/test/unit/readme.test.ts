import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../../../..");
const libRoot = resolve(__dirname, "../..");

describe("root README", () => {
	const content = readFileSync(resolve(repoRoot, "README.md"), "utf-8");

	it("has a Quick start section", () => {
		expect(content).toMatch(/^## Quick start/m);
	});

	it("has a CLI commands section", () => {
		expect(content).toMatch(/^## CLI commands/m);
	});

	it("has a Configuration section with defineConfig", () => {
		expect(content).toMatch(/^## Configuration/m);
		expect(content).toMatch(/```ts[\s\S]*?defineConfig\([\s\S]*?```/);
	});

	it("has a Segment section with defineSegment code example", () => {
		expect(content).toMatch(/^### Segment/m);
		expect(content).toMatch(/```ts[\s\S]*?defineSegment\([\s\S]*?```/);
	});

	it("has a code example using waitForNext and hold", () => {
		expect(content).toMatch(/```ts[\s\S]*?waitForNext\(\)[\s\S]*?hold\([\s\S]*?```/);
	});

	it("references videowright dev in a CLI table or code block", () => {
		expect(content).toMatch(/`videowright dev/);
	});

	it("references videowright script in a CLI table or code block", () => {
		expect(content).toMatch(/`videowright script/);
	});

	it("references the MIT license", () => {
		expect(content).toMatch(/## License[\s\S]*?MIT/);
	});
});

describe("lib README", () => {
	const content = readFileSync(resolve(libRoot, "README.md"), "utf-8");

	it("has an Install section", () => {
		expect(content).toMatch(/^## Install/m);
	});

	it("has a code example with defineSegment", () => {
		expect(content).toMatch(/```ts[\s\S]*?defineSegment\([\s\S]*?```/);
	});

	it("references npm install videowright", () => {
		expect(content).toContain("npm install videowright");
	});

	it("references the MIT license", () => {
		expect(content).toMatch(/## License[\s\S]*?MIT/);
	});

	it("links to the repo for full documentation", () => {
		expect(content).toContain("github.com/scosman/video_forge");
	});
});
