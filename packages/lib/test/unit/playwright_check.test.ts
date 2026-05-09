import { describe, expect, it } from "vitest";
import { UserError } from "../../src/cli/errors.js";

describe("playwright check", () => {
	it("playwright_not_installed_error_message", async () => {
		// Test that the error message is helpful when playwright is not installed.
		// We test this by dynamically importing and checking the error contract.
		// In CI, playwright may or may not be installed, so we test the error path
		// by checking the function signature and contract.

		const { ensurePlaywright } = await import("../../src/cli/playwright_check.js");
		expect(typeof ensurePlaywright).toBe("function");

		// The function should return a promise
		// If playwright IS installed in dev, it succeeds; if not, it throws UserError.
		// We test the error type contract rather than forcing failure.
		try {
			const pw = await ensurePlaywright();
			// If we get here, playwright is installed -- verify the shape
			expect(pw).toHaveProperty("chromium");
			expect(pw.chromium).toHaveProperty("launch");
		} catch (e) {
			// If we get here, playwright is NOT installed -- verify the error
			expect(e).toBeInstanceOf(UserError);
			const err = e as UserError;
			expect(err.message).toBe("Playwright is not installed");
			expect(err.hint).toContain("npm install playwright");
		}
	});
});
