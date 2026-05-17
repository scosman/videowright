/**
 * Regression test: the render-mode Vite server must register
 * projectVirtualModulePlugin so that Vite's HTML crawl of index.html
 * (which imports virtual:videowright/project via entry_index.ts)
 * does not abort with an unresolved-import error.
 *
 * This test boots a real Vite dev server with the same plugin set that
 * render.ts uses and asserts the server starts and resolves cleanly.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { ViteDevServer } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	findPackageRoot,
	fullReloadPlugin,
	globalsVirtualModulePlugin,
	projectVirtualModulePlugin,
	segmentDiscoveryPlugin,
} from "../../src/cli/vite_helpers.js";
import type { ProjectInfo } from "../../src/types.js";

let tmpDir: string;
let server: ViteDevServer | null = null;

function makeTmpDir(): string {
	const dir = join(tmpdir(), `vw-render-vite-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(dir, { recursive: true });
	return dir;
}

function writeConfig(root: string): void {
	writeFileSync(join(root, "videowright.config.ts"), "export default {};", "utf-8");
}

function writeVideo(root: string, slug: string): string {
	const videoDir = join(root, "videos", slug);
	mkdirSync(videoDir, { recursive: true });
	const timelinePath = join(videoDir, "timeline.ts");
	writeFileSync(
		timelinePath,
		`export default { meta: { title: "${slug}" }, segments: [] };`,
		"utf-8",
	);
	return resolve(timelinePath);
}

beforeEach(() => {
	tmpDir = makeTmpDir();
});

afterEach(async () => {
	if (server) {
		await server.close();
		server = null;
	}
	if (tmpDir && existsSync(tmpDir)) {
		rmSync(tmpDir, { recursive: true, force: true });
	}
});

describe("render Vite plugin config", () => {
	it("render_server_boots_with_project_virtual_module_plugin", async () => {
		writeConfig(tmpDir);
		const timelinePath = writeVideo(tmpDir, "demo");

		const pkgRoot = findPackageRoot();
		const entryDir = resolve(pkgRoot, "src/cli/entry");

		const projectInfo: ProjectInfo = {
			projectName: "test-project",
			videos: [
				{
					slug: "demo",
					timelinePath,
					title: "demo",
					style: "unknown",
					mtimeMs: Date.now(),
				},
			],
		};

		const { createServer } = await import("vite");

		// Boot the server with the same plugin list render.ts uses.
		// Before the fix, this would throw:
		//   "virtual:videowright/project could not be resolved"
		server = await createServer({
			configFile: false,
			root: entryDir,
			plugins: [
				fullReloadPlugin(),
				segmentDiscoveryPlugin(tmpDir),
				globalsVirtualModulePlugin({
					timelinePath,
					consumerRoot: tmpDir,
					renderFps: 30,
				}),
				projectVirtualModulePlugin(projectInfo),
			],
			server: {
				port: 0,
				strictPort: false,
				fs: {
					allow: [tmpDir, pkgRoot],
				},
			},
			resolve: {
				alias: {
					"@consumer": tmpDir,
				},
			},
		});

		await server.listen();

		const url = server.resolvedUrls?.local?.[0];
		expect(url).toBeDefined();
		expect(url).toContain("http://");
	});

	it("project_virtual_module_plugin_resolves_and_loads", () => {
		const projectInfo: ProjectInfo = {
			projectName: "test",
			videos: [
				{
					slug: "demo",
					timelinePath: "/fake/timeline.ts",
					title: "demo",
					style: "unknown",
					mtimeMs: 0,
				},
			],
		};

		const plugin = projectVirtualModulePlugin(projectInfo);

		// Direct hook invocation -- update if plugin shape changes to
		// object-style hooks (i.e. { handler: fn }) instead of bare functions.

		// The plugin must claim the virtual module ID so Vite doesn't
		// report it as unresolved during HTML crawl.
		const resolvedId = (plugin.resolveId as (id: string) => string | undefined)(
			"virtual:videowright/project",
		);
		expect(resolvedId).toBeDefined();
		expect(resolvedId).toContain("virtual:videowright/project");

		// The plugin must return valid JS when the resolved ID is loaded.
		// resolvedId is guaranteed non-undefined by the assertion above.
		const code = (plugin.load as (id: string) => string | undefined)(resolvedId as string);
		expect(code).toBeDefined();
		expect(code).toContain("export default");
		expect(code).toContain("test");
	});
});
