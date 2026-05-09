import { describe, expect, it, vi } from "vitest";
import { main } from "../../src/cli/index.js";

describe("CLI main: record/render commands", () => {
	it("main_record_missing_config_exits_1", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const code = await main(["record"]);
		expect(code).toBe(1);
		expect(errorSpy).toHaveBeenCalled();
		const errorMsg = errorSpy.mock.calls[0][0] as string;
		expect(errorMsg).toContain("videowright:");
		expect(errorMsg).toContain("videowright.config.ts");
		errorSpy.mockRestore();
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

	it("main_help_shows_record_and_render", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const code = await main(["--help"]);
		expect(code).toBe(0);
		const helpText = logSpy.mock.calls[0][0] as string;
		expect(helpText).toContain("record");
		expect(helpText).toContain("render");
		logSpy.mockRestore();
	});
});
