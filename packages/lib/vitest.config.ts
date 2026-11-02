import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		root: ".",
		include: ["test/**/*.test.ts"],
		// Maps `videowright` to source for modules Node imports directly (tsx-loaded
		// consumer files), which the resolve.alias below does not reach.
		setupFiles: ["test/setup/resolve_videowright_to_source.ts"],
	},
	resolve: {
		alias: [
			{
				find: "virtual:vw-globals",
				replacement: resolve(__dirname, "test/__mocks__/virtual-vw-globals.ts"),
			},
			{
				find: "virtual:vw-segments",
				replacement: resolve(__dirname, "test/__mocks__/virtual-vw-segments.ts"),
			},
			// Entry files import the library by package name; unit tests run them
			// against source so they never depend on a stale or missing dist/.
			{ find: /^videowright$/, replacement: resolve(__dirname, "src/index.ts") },
		],
	},
});
