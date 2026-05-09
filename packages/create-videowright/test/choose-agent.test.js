import { createInterface } from "node:readline";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

vi.mock("node:readline", () => {
	const mockQuestion = vi.fn();
	const mockClose = vi.fn();
	return {
		createInterface: vi.fn(() => ({
			question: mockQuestion,
			close: mockClose,
		})),
	};
});

const { chooseAgent } = await import("../bin/index.js");

function mockReadlineAnswer(answer) {
	const mockRl = createInterface();
	mockRl.question.mockImplementation((_prompt, callback) => {
		callback(answer);
	});
}

describe("chooseAgent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns_null_when_no_agents_detected", async () => {
		const result = await chooseAgent({
			claude: false,
			codex: false,
			opencode: false,
		});
		expect(result).toBeNull();
	});

	it("returns_claude_when_only_claude_detected", async () => {
		const result = await chooseAgent({
			claude: true,
			codex: false,
			opencode: false,
		});
		expect(result).toBe("claude");
	});

	it("returns_codex_when_only_codex_detected", async () => {
		const result = await chooseAgent({
			claude: false,
			codex: true,
			opencode: false,
		});
		expect(result).toBe("codex");
	});

	it("returns_opencode_when_only_opencode_detected", async () => {
		const result = await chooseAgent({
			claude: false,
			codex: false,
			opencode: true,
		});
		expect(result).toBe("opencode");
	});

	it("prompts_and_returns_first_choice_for_multiple_agents", async () => {
		mockReadlineAnswer("1");
		const result = await chooseAgent({
			claude: true,
			codex: true,
			opencode: false,
		});
		expect(result).toBe("claude");
	});

	it("prompts_and_returns_second_choice_for_multiple_agents", async () => {
		mockReadlineAnswer("2");
		const result = await chooseAgent({
			claude: true,
			codex: true,
			opencode: false,
		});
		expect(result).toBe("codex");
	});

	it("prompts_and_returns_third_choice_for_all_agents", async () => {
		mockReadlineAnswer("3");
		const result = await chooseAgent({
			claude: true,
			codex: true,
			opencode: true,
		});
		expect(result).toBe("opencode");
	});

	it("defaults_to_first_detected_on_empty_input", async () => {
		mockReadlineAnswer("");
		const result = await chooseAgent({
			claude: true,
			codex: true,
			opencode: true,
		});
		expect(result).toBe("claude");
	});

	it("defaults_to_first_detected_on_invalid_input", async () => {
		mockReadlineAnswer("xyz");
		const result = await chooseAgent({
			claude: true,
			codex: true,
			opencode: true,
		});
		expect(result).toBe("claude");
	});

	it("defaults_to_codex_when_claude_not_detected", async () => {
		mockReadlineAnswer("");
		const result = await chooseAgent({
			claude: false,
			codex: true,
			opencode: true,
		});
		expect(result).toBe("codex");
	});

	it("does_not_prompt_for_single_agent", async () => {
		await chooseAgent({ claude: true, codex: false, opencode: false });
		expect(createInterface).not.toHaveBeenCalled();
	});

	it("does_not_prompt_for_zero_agents", async () => {
		await chooseAgent({ claude: false, codex: false, opencode: false });
		expect(createInterface).not.toHaveBeenCalled();
	});
});
