import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runDev } from "../../src/cli/dev.js";
import { UserError } from "../../src/cli/errors.js";
import { main } from "../../src/cli/index.js";
import { runScript } from "../../src/cli/script_cmd.js";

let tmpDir: string;

function makeTmpDir(): string {
	const dir = join(
		process.env.TMPDIR ?? "/tmp",
		`vw-cli-errors-${Date.now()}-${Math.random().toString(36).slice(2)}`,
	);
	mkdirSync(dir, { recursive: true });
	return dir;
}

beforeEach(() => {
	tmpDir = makeTmpDir();
});

afterEach(() => {
	if (tmpDir && existsSync(tmpDir)) {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});

describe("CLI error handling", () => {
	it("cli_dev_missing_config_exits_1", async () => {
		try {
			await runDev({ cwd: tmpDir });
			expect.unreachable("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const error = e as UserError;
			expect(error.message).toContain("No videowright.config.ts found");
			expect(error.message).toContain(tmpDir);
			expect(error.hint).toBeDefined();
		}
	});

	it("cli_dev_missing_timeline_exits_1", async () => {
		// Has config but no videos
		writeFileSync(
			join(tmpDir, "videowright.config.ts"),
			`export default { projectStructure: "v1" };`,
			"utf-8",
		);

		try {
			await runDev({ cwd: tmpDir });
			expect.unreachable("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const error = e as UserError;
			expect(error.message).toContain("No videos found");
		}
	});

	it("cli_script_missing_config_exits_1", async () => {
		try {
			await runScript({ cwd: tmpDir });
			expect.unreachable("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const error = e as UserError;
			expect(error.message).toContain("No videowright.config.ts found");
		}
	});

	it("cli_script_missing_timeline_exits_1", async () => {
		writeFileSync(
			join(tmpDir, "videowright.config.ts"),
			`export default { projectStructure: "v1" };`,
			"utf-8",
		);

		try {
			await runScript({ cwd: tmpDir });
			expect.unreachable("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const error = e as UserError;
			expect(error.message).toContain("No videos found");
		}
	});

	it("cli_script_explicit_timeline_not_found", async () => {
		writeFileSync(
			join(tmpDir, "videowright.config.ts"),
			`export default { projectStructure: "v1" };`,
			"utf-8",
		);

		try {
			await runScript({ cwd: tmpDir, positional: "videos/nope/timeline.ts" });
			expect.unreachable("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const error = e as UserError;
			expect(error.message).toContain("Timeline not found");
			expect(error.hint).toContain("Check that the file exists");
		}
	});

	it("cli_main_system_error_returns_exit_code_2", async () => {
		// Simulate a system error by providing a script command with a cwd that has
		// config + timeline but an invalid timeline file that causes a non-UserError throw.
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Config present, timeline file exists but contains syntax that will cause
		// a runtime load error (not a UserError).
		writeFileSync(
			join(tmpDir, "videowright.config.ts"),
			`export default { projectStructure: "v1" };`,
			"utf-8",
		);
		const videoDir = join(tmpDir, "videos", "broken");
		mkdirSync(videoDir, { recursive: true });
		writeFileSync(
			join(videoDir, "timeline.ts"),
			"THIS IS NOT VALID JAVASCRIPT AT ALL %%%",
			"utf-8",
		);

		// Override cwd for the main function
		const origCwd = process.cwd;
		process.cwd = () => tmpDir;
		try {
			const code = await main(["script"]);
			expect(code).toBe(2);
			expect(errorSpy).toHaveBeenCalled();
		} finally {
			process.cwd = origCwd;
			errorSpy.mockRestore();
		}
	});
});
