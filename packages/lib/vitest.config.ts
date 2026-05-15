import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		root: ".",
		include: ["test/**/*.test.ts"],
	},
	resolve: {
		alias: {
			"virtual:vw-globals": resolve(__dirname, "test/__mocks__/virtual-vw-globals.ts"),
			"virtual:vw-segments": resolve(__dirname, "test/__mocks__/virtual-vw-segments.ts"),
		},
	},
});
