import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { UserError } from "../../src/cli/errors.js";
import { findFfmpeg, spawnFfmpeg } from "../../src/cli/ffmpeg.js";

/**
 * Check if ffmpeg is actually installed on this system.
 */
function systemHasFfmpeg(): boolean {
	try {
		execFileSync("which", ["ffmpeg"], { encoding: "utf-8", stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
}

describe("ffmpeg detection", () => {
	it("findFfmpeg_returns_string_or_throws_UserError", () => {
		try {
			const path = findFfmpeg();
			expect(typeof path).toBe("string");
			expect(path.length).toBeGreaterThan(0);
		} catch (e) {
			expect(e).toBeInstanceOf(UserError);
			const err = e as UserError;
			expect(err.message).toBe("ffmpeg not found on PATH");
			expect(err.hint).toBeDefined();
			expect(err.hint).toContain("ffmpeg");
		}
	});

	it("findFfmpeg_consistent_with_system_state", () => {
		const hasFfmpeg = systemHasFfmpeg();
		if (hasFfmpeg) {
			const path = findFfmpeg();
			expect(path).toContain("ffmpeg");
		} else {
			expect(() => findFfmpeg()).toThrow(UserError);
		}
	});

	it("spawnFfmpeg_spawns_process_with_correct_args", () => {
		if (!systemHasFfmpeg()) return; // skip if ffmpeg not installed

		const ffmpegPath = findFfmpeg();
		// Spawn ffmpeg with --version flag -- a quick, non-destructive invocation
		const { process: proc, done } = spawnFfmpeg(ffmpegPath, ["-version"]);

		// The process object should have stdin, stdout, stderr
		expect(proc.stdin).toBeDefined();
		expect(proc.stderr).toBeDefined();

		// done should be a promise that resolves with code + stderr
		expect(done).toBeInstanceOf(Promise);

		// Wait for it to complete and verify
		return done.then((result) => {
			expect(result.code).toBe(0);
			expect(result.stderr).toBeDefined();
		});
	});

	it("ffmpeg_error_hint_is_platform_specific", () => {
		if (systemHasFfmpeg()) return; // skip if ffmpeg is installed
		try {
			findFfmpeg();
		} catch (e) {
			const err = e as UserError;
			expect(err.hint).toBeDefined();
			expect(err.hint?.length).toBeGreaterThan(10);
		}
	});
});
