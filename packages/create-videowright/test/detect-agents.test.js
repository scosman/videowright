import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

const { detectAgents } = await import("../bin/index.js");

function mockSpawnForAgents(installedSet) {
	spawn.mockImplementation((cmd) => {
		const child = new EventEmitter();
		const installed = installedSet.has(cmd);
		process.nextTick(() => child.emit("exit", installed ? 0 : 1));
		return child;
	});
}

function mockSpawnError() {
	spawn.mockImplementation(() => {
		const child = new EventEmitter();
		process.nextTick(() => child.emit("error", new Error("ENOENT")));
		return child;
	});
}

describe("detectAgents", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("detects_all_agents_installed", async () => {
		mockSpawnForAgents(new Set(["claude", "codex", "opencode"]));

		const result = await detectAgents();

		expect(result).toEqual({ claude: true, codex: true, opencode: true });
		expect(spawn).toHaveBeenCalledTimes(3);
	});

	it("detects_no_agents_installed", async () => {
		mockSpawnForAgents(new Set());

		const result = await detectAgents();

		expect(result).toEqual({ claude: false, codex: false, opencode: false });
	});

	it("detects_only_claude", async () => {
		mockSpawnForAgents(new Set(["claude"]));

		const result = await detectAgents();

		expect(result).toEqual({ claude: true, codex: false, opencode: false });
	});

	it("detects_only_codex", async () => {
		mockSpawnForAgents(new Set(["codex"]));

		const result = await detectAgents();

		expect(result).toEqual({ claude: false, codex: true, opencode: false });
	});

	it("detects_only_opencode", async () => {
		mockSpawnForAgents(new Set(["opencode"]));

		const result = await detectAgents();

		expect(result).toEqual({ claude: false, codex: false, opencode: true });
	});

	it("detects_claude_and_opencode", async () => {
		mockSpawnForAgents(new Set(["claude", "opencode"]));

		const result = await detectAgents();

		expect(result).toEqual({ claude: true, codex: false, opencode: true });
	});

	it("treats_nonzero_exit_as_not_installed", async () => {
		spawn.mockImplementation(() => {
			const child = new EventEmitter();
			process.nextTick(() => child.emit("exit", 127));
			return child;
		});

		const result = await detectAgents();

		expect(result).toEqual({ claude: false, codex: false, opencode: false });
	});

	it("treats_spawn_error_as_not_installed", async () => {
		mockSpawnError();

		const result = await detectAgents();

		expect(result).toEqual({ claude: false, codex: false, opencode: false });
	});

	it("passes_correct_args_to_spawn", async () => {
		mockSpawnForAgents(new Set(["claude", "codex", "opencode"]));

		await detectAgents();

		expect(spawn).toHaveBeenCalledWith("claude", ["--version"], { stdio: "ignore" });
		expect(spawn).toHaveBeenCalledWith("codex", ["--version"], { stdio: "ignore" });
		expect(spawn).toHaveBeenCalledWith("opencode", ["--version"], { stdio: "ignore" });
	});

	it("runs_probes_in_parallel", async () => {
		// All three spawn calls should happen before any resolves
		const children = [];
		spawn.mockImplementation(() => {
			const child = new EventEmitter();
			children.push(child);
			return child;
		});

		const promise = detectAgents();

		// All three should be spawned immediately
		expect(children).toHaveLength(3);

		// Resolve them all
		for (const child of children) {
			child.emit("exit", 0);
		}

		const result = await promise;
		expect(result).toEqual({ claude: true, codex: true, opencode: true });
	});
});
