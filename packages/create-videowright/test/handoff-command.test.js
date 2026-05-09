import { describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

const { handoffCommand } = await import("../bin/index.js");

const EXPECTED_URL =
	"https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md";
const EXPECTED_PROMPT = `Install Videowright using these instructions: ${EXPECTED_URL}`;

describe("handoffCommand", () => {
	it.each([
		{
			agent: "claude",
			expectedCmd: "claude",
			expectedArgs: [EXPECTED_PROMPT],
		},
		{
			agent: "codex",
			expectedCmd: "codex",
			expectedArgs: [EXPECTED_PROMPT],
		},
		{
			agent: "opencode",
			expectedCmd: "opencode",
			expectedArgs: ["--prompt", EXPECTED_PROMPT],
		},
	])("returns_correct_command_for_$agent", ({ agent, expectedCmd, expectedArgs }) => {
		const result = handoffCommand(agent);

		expect(result.cmd).toBe(expectedCmd);
		expect(result.args).toEqual(expectedArgs);
	});

	it("throws_for_unknown_agent", () => {
		expect(() => handoffCommand("unknown")).toThrow("Unknown agent: unknown");
	});

	it("prompt_contains_install_url", () => {
		const { args } = handoffCommand("claude");
		expect(args[0]).toContain(EXPECTED_URL);
	});
});
