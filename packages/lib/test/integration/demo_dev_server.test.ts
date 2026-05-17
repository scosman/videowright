/**
 * Integration test: boot the actual Vite dev server against examples/videowright_demo/
 * and verify MPA routing middleware behavior.
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
	it("boots and serves index page at root", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5199,
		});

		expect(server.url).toContain("5199");

		const res = await fetch(server.url);
		expect(res.status).toBe(200);

		const html = await res.text();
		expect(html).toContain('id="app"');
		expect(html).toContain("Videowright Dev");
		expect(html).toContain("entry_index.ts");
	});

	it("serves video page for known slug and its script resolves", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5200,
		});

		const res = await fetch(`${server.url}video/demo_video`);
		expect(res.status).toBe(200);

		const html = await res.text();
		expect(html).toContain("entry_video.ts");
		expect(html).toContain('id="app"');

		// The script src must be absolute (/entry_video.ts) so the browser
		// resolves it correctly regardless of the URL path (/video/<slug>).
		expect(html).toContain('src="/entry_video.ts"');

		// Verify the script is actually served (not 404) when fetched
		const scriptRes = await fetch(`${server.url}entry_video.ts`);
		expect(scriptRes.status).toBe(200);
		const scriptBody = await scriptRes.text();
		expect(scriptBody).toContain("parseSlugFromPath");
	});

	it("serves video page for known slug with trailing slash", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5201,
		});

		const res = await fetch(`${server.url}video/demo_video/`);
		expect(res.status).toBe(200);

		const html = await res.text();
		expect(html).toContain("entry_video.ts");
	});

	it("returns 404 for unknown video slug", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5202,
		});

		const res = await fetch(`${server.url}video/does-not-exist`);
		expect(res.status).toBe(404);

		const html = await res.text();
		expect(html).toContain("Not found");
		expect(html).toContain('href="/"');
	});

	it("returns 404 for unknown top-level path", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5203,
		});

		const res = await fetch(`${server.url}unknown-path`);
		expect(res.status).toBe(404);

		const html = await res.text();
		expect(html).toContain("Not found");
	});

	it("serves render.html without rewriting", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5204,
		});

		const res = await fetch(`${server.url}render.html`);
		expect(res.status).toBe(200);

		const html = await res.text();
		expect(html).toContain("render_entry.ts");
		expect(html).not.toContain('id="app"');
	});

	it("passes through Vite internals", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5205,
		});

		const res = await fetch(`${server.url}@vite/client`);
		expect(res.status).toBe(200);
	});

	it("virtual:vw-segments module resolves with all 8 segments", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5206,
		});

		const res = await fetch(`${server.url}@id/virtual:vw-segments`);
		expect(res.status).toBe(200);

		const code = await res.text();

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
	});

	it("virtual:videowright/project module contains discovered videos", async () => {
		server = await runDev({
			cwd: DEMO_ROOT,
			port: 5207,
		});

		const res = await fetch(`${server.url}@id/__x00__virtual:videowright/project`);
		expect(res.status).toBe(200);

		const code = await res.text();
		expect(code).toContain("demo_video");
		expect(code).toContain("videowright_demo");
	});
});
