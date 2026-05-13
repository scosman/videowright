/**
 * Integration test: boot the actual Vite dev server against examples/videowright_demo/
 * and verify the page loads without errors.
 *
 * This catches the real issue where import.meta.glob with aliases fails silently,
 * by verifying the virtual:vw-segments module provides segment loaders to the
 * entry client.
 */

import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type DevResult, runDev } from "../../src/cli/dev.js";

const DEMO_ROOT = resolve(__dirname, "../../../../examples/videowright_demo");

let server: DevResult | null = null;

afterEach(async () => {
	if (server) {
		await server.close();
		server = null;
	}
});

describe("demo dev server", () => {
	it("boots and serves HTML without segment discovery errors", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5199,
		});

		expect(server.url).toContain("5199");

		// Fetch the HTML page
		const res = await fetch(server.url);
		expect(res.status).toBe(200);

		const html = await res.text();
		expect(html).toContain("player-host");
		expect(html).toContain("Videowright Dev");
	});

	it("virtual:vw-segments module resolves with all 8 segments using @consumer alias", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5200,
		});

		// Fetch the virtual module directly from Vite's transform pipeline.
		// Vite serves virtual modules under /@id/ prefix.
		const res = await fetch(`${server.url}@id/virtual:vw-segments`);
		expect(res.status).toBe(200);

		const code = await res.text();

		// The virtual module should contain dynamic imports for all 8 segments
		const expectedIds = [
			"cold-open",
			"title-card",
			"web-tech-gallery",
			"interactive-dev",
			"pixel-perfect-export",
			"voiceover-sync",
			"any-coding-agent",
			"install-cta",
		];

		for (const id of expectedIds) {
			expect(code, `virtual module should contain segment "${id}"`).toContain(
				`/segments/${id}/index.ts`,
			);
		}

		// Vite resolves the @consumer alias to /@fs/ URLs during transform.
		// Verify the generated source used the alias (not raw absolute paths)
		// by checking that raw unresolved absolute paths aren't present.
		// Vite's /@fs/ prefix is expected -- it's Vite's standard resolution format.
		expect(code, "virtual module should not contain raw absolute filesystem paths").not.toContain(
			`import("${DEMO_ROOT}`,
		);
	});

	it("entry_client.ts is served and imports virtual:vw-segments", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5201,
		});

		// Fetch the entry client module
		const res = await fetch(`${server.url}entry_client.ts`);
		expect(res.status).toBe(200);

		const code = await res.text();

		// Vite should have transformed the virtual import into a resolved module
		// The transformed code should NOT contain the original broken glob pattern
		expect(code).not.toContain('import.meta.glob("@consumer');
		// It should reference the virtual module (Vite resolves it)
		expect(code).toContain("vw-segments");
	});
});
