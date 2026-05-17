import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runDev } from "../../src/cli/dev.js";
import { UserError } from "../../src/cli/errors.js";

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

	it("cli_dev_zero_videos_boots_successfully", async () => {
		// Has config but no videos -- dev server should still boot (shows homepage with empty state)
		writeFileSync(
			join(tmpDir, "videowright.config.ts"),
			`export default { projectStructure: "v1" };`,
			"utf-8",
		);

		const result = await runDev({ cwd: tmpDir });
		expect(result.url).toContain("http://");
		await result.close();
	});
});
