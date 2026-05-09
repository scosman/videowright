import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

vi.mock("node:readline", () => ({
	createInterface: vi.fn(() => ({
		question: vi.fn(),
		close: vi.fn(),
	})),
}));

const { main, spawnAgent } = await import("../bin/index.js");

/**
 * Configure spawn mock: detection probes (called with --version)
 * auto-resolve, while the handoff spawn returns a passive EventEmitter.
 */
function mockSpawnForDetection(installedSet) {
	spawn.mockImplementation((cmd, args) => {
		const child = new EventEmitter();
		if (args[0] === "--version") {
			// Detection probe — resolve immediately
			const installed = installedSet.has(cmd);
			process.nextTick(() => child.emit("exit", installed ? 0 : 1));
		}
		// Handoff spawn — leave the EventEmitter passive (no auto-emit)
		return child;
	});
}

describe("main", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("prints_fallback_when_no_agents_detected", async () => {
		mockSpawnForDetection(new Set());

		await main();

		const output = console.log.mock.calls.map((c) => c[0]).join("\n");
		expect(output).toContain("We couldn't find Claude Code, Codex, or opencode installed.");
		expect(output).toContain("Install Videowright using these instructions:");
		expect(output).toContain(
			"https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md",
		);
	});

	it("spawns_agent_when_one_detected", async () => {
		mockSpawnForDetection(new Set(["claude"]));

		await main();

		// Find the handoff spawn call (not the detection probe)
		const handoffCall = spawn.mock.calls.find((c) => c[1][0] !== "--version");
		expect(handoffCall[0]).toBe("claude");
		expect(handoffCall[1][0]).toContain("Install Videowright");
		expect(handoffCall[2]).toEqual({ stdio: "inherit" });
	});

	it("spawns_codex_when_only_codex_detected", async () => {
		mockSpawnForDetection(new Set(["codex"]));

		await main();

		const handoffCall = spawn.mock.calls.find((c) => c[1][0] !== "--version");
		expect(handoffCall[0]).toBe("codex");
		expect(handoffCall[1][0]).toContain("Install Videowright");
		expect(handoffCall[2]).toEqual({ stdio: "inherit" });
	});

	it("spawns_opencode_with_prompt_flag_when_only_opencode_detected", async () => {
		mockSpawnForDetection(new Set(["opencode"]));

		await main();

		const handoffCall = spawn.mock.calls.find((c) => c[1][0] !== "--version");
		expect(handoffCall[0]).toBe("opencode");
		expect(handoffCall[1][0]).toBe("--prompt");
		expect(handoffCall[1][1]).toContain("Install Videowright");
		expect(handoffCall[2]).toEqual({ stdio: "inherit" });
	});

	it("falls_back_gracefully_when_readline_rejects", async () => {
		// Simulate multiple agents detected but non-interactive stdin
		mockSpawnForDetection(new Set(["claude", "codex"]));

		// Override the readline mock to reject
		const { createInterface } = await import("node:readline");
		createInterface.mockReturnValue({
			question: (_prompt, _cb) => {
				throw new Error("readline closed");
			},
			close: vi.fn(),
		});

		await main();

		// Should fall back to first detected agent (claude)
		const handoffCall = spawn.mock.calls.find((c) => c[1][0] !== "--version");
		expect(handoffCall[0]).toBe("claude");
	});
});

describe("spawnAgent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("spawns_with_inherited_stdio", () => {
		const mockChild = new EventEmitter();
		spawn.mockReturnValue(mockChild);

		spawnAgent("claude", ["test"]);

		expect(spawn).toHaveBeenCalledWith("claude", ["test"], { stdio: "inherit" });
	});

	it("exits_with_child_exit_code", () => {
		const mockChild = new EventEmitter();
		spawn.mockReturnValue(mockChild);
		const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

		spawnAgent("claude", ["test"]);
		mockChild.emit("exit", 42);

		expect(exitSpy).toHaveBeenCalledWith(42);
		exitSpy.mockRestore();
	});

	it("exits_with_zero_when_child_exit_code_is_null", () => {
		const mockChild = new EventEmitter();
		spawn.mockReturnValue(mockChild);
		const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

		spawnAgent("claude", ["test"]);
		mockChild.emit("exit", null);

		expect(exitSpy).toHaveBeenCalledWith(0);
		exitSpy.mockRestore();
	});

	it("exits_with_1_on_spawn_error", () => {
		const mockChild = new EventEmitter();
		spawn.mockReturnValue(mockChild);
		const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		spawnAgent("claude", ["test"]);
		mockChild.emit("error", new Error("ENOENT"));

		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to start claude"));
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining("npm init videowright"));
		exitSpy.mockRestore();
	});
});
