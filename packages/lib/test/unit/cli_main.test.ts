import { describe, expect, it, vi } from "vitest";
import { main } from "../../src/cli/index.js";

describe("CLI main", () => {
	it("main_help_returns_0", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const code = await main(["--help"]);
		expect(code).toBe(0);
		expect(logSpy).toHaveBeenCalledOnce();
		expect(logSpy.mock.calls[0][0]).toContain("Usage:");
		logSpy.mockRestore();
	});

	it("main_version_returns_0", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const code = await main(["--version"]);
		expect(code).toBe(0);
		expect(logSpy).toHaveBeenCalledOnce();
		logSpy.mockRestore();
	});

	it("main_unknown_command_returns_1", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const code = await main(["frob"]);
		expect(code).toBe(1);
		expect(errorSpy).toHaveBeenCalledOnce();
		expect(errorSpy.mock.calls[0][0]).toContain("Unknown command: frob");
		errorSpy.mockRestore();
	});

	it("main_empty_shows_help", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const code = await main([]);
		expect(code).toBe(0);
		expect(logSpy).toHaveBeenCalledOnce();
		expect(logSpy.mock.calls[0][0]).toContain("Usage:");
		logSpy.mockRestore();
	});

	it("main_help_shows_render_not_record", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const code = await main(["--help"]);
		expect(code).toBe(0);
		const helpText = logSpy.mock.calls[0][0] as string;
		expect(helpText).toContain("render");
		expect(helpText).not.toContain("record");
		logSpy.mockRestore();
	});

	it("main_render_missing_config_exits_1", async () => {
		vi.mock("../../src/cli/ffmpeg.js", () => ({
			findFfmpeg: () => "/usr/bin/ffmpeg",
			spawnFfmpeg: vi.fn(),
		}));
		vi.mock("../../src/cli/playwright_check.js", () => ({
			ensurePlaywright: async () => ({ chromium: { launch: vi.fn() } }),
		}));

		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const code = await main(["render"]);
		expect(code).toBe(1);
		expect(errorSpy).toHaveBeenCalled();
		const errorMsg = errorSpy.mock.calls[0][0] as string;
		expect(errorMsg).toContain("videowright:");
		expect(errorMsg).toContain("videowright.config.ts");
		errorSpy.mockRestore();

		vi.restoreAllMocks();
	});
});
