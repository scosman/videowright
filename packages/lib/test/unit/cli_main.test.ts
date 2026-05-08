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
});
