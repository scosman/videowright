import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./test/e2e",
	timeout: 60_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
	use: {
		headless: true,
		viewport: { width: 1280, height: 720 },
	},
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
});
