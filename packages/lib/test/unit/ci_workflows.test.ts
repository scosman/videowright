import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dirname, "../../../..");
const WORKFLOWS = resolve(ROOT, ".github/workflows");

interface Step {
	uses?: string;
	run?: string;
	name?: string;
	if?: string;
	with?: Record<string, unknown>;
	"working-directory"?: string;
}

interface Job {
	"runs-on": string;
	steps: Step[];
}

function loadWorkflow(name: string): Record<string, unknown> {
	const raw = readFileSync(resolve(WORKFLOWS, name), "utf-8");
	return parse(raw) as Record<string, unknown>;
}

function getSteps(doc: Record<string, unknown>): Step[] {
	const jobs = doc.jobs as Record<string, Job>;
	return Object.values(jobs)[0].steps;
}

function getRunCommands(steps: Step[]): string[] {
	return steps.filter((s) => s.run).map((s) => s.run as string);
}

describe("CI workflow files", () => {
	describe("ci.yml", () => {
		it("exists and is valid YAML with on and jobs keys", () => {
			const doc = loadWorkflow("ci.yml");
			expect(doc).toBeTruthy();
			expect(doc).toHaveProperty("on");
			expect(doc).toHaveProperty("jobs");
		});

		it("triggers on push to main and pull_request", () => {
			const doc = loadWorkflow("ci.yml");
			const on = doc.on as Record<string, unknown>;
			expect(on).toHaveProperty("push");
			expect(on).toHaveProperty("pull_request");
			const push = on.push as Record<string, unknown>;
			expect(push.branches).toContain("main");
		});

		it("runs typecheck, lint, and test steps", () => {
			const doc = loadWorkflow("ci.yml");
			const runCmds = getRunCommands(getSteps(doc));
			expect(runCmds).toContainEqual(expect.stringContaining("npm run typecheck"));
			expect(runCmds).toContainEqual(expect.stringContaining("npm run lint"));
			expect(runCmds).toContainEqual(expect.stringContaining("npm test"));
		});

		it("uses Node 22 and npm cache", () => {
			const doc = loadWorkflow("ci.yml");
			const steps = getSteps(doc);
			const setupNode = steps.find((s) => s.uses?.startsWith("actions/setup-node"));
			expect(setupNode).toBeTruthy();
			expect(setupNode?.with?.["node-version"]).toBe(22);
			expect(setupNode?.with?.cache).toBe("npm");
		});
	});

	describe("e2e.yml", () => {
		it("exists and is valid YAML with on and jobs keys", () => {
			const doc = loadWorkflow("e2e.yml");
			expect(doc).toBeTruthy();
			expect(doc).toHaveProperty("on");
			expect(doc).toHaveProperty("jobs");
		});

		it("triggers on push to main and pull_request", () => {
			const doc = loadWorkflow("e2e.yml");
			const on = doc.on as Record<string, unknown>;
			expect(on).toHaveProperty("push");
			expect(on).toHaveProperty("pull_request");
			const push = on.push as Record<string, unknown>;
			expect(push.branches).toContain("main");
		});

		it("installs Playwright Chromium with system deps", () => {
			const doc = loadWorkflow("e2e.yml");
			const runCmds = getRunCommands(getSteps(doc));
			expect(runCmds).toContainEqual(
				expect.stringContaining("playwright install chromium --with-deps"),
			);
		});

		it("runs e2e tests via workspace command", () => {
			const doc = loadWorkflow("e2e.yml");
			const runCmds = getRunCommands(getSteps(doc));
			expect(runCmds).toContainEqual(expect.stringContaining("test:e2e"));
		});

		it("uploads Playwright report on failure", () => {
			const doc = loadWorkflow("e2e.yml");
			const steps = getSteps(doc);
			const uploadStep = steps.find((s) => s.uses?.startsWith("actions/upload-artifact"));
			expect(uploadStep).toBeTruthy();
			expect(uploadStep?.if).toContain("failure()");
		});
	});
});
