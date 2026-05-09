import { defineConfig } from "videowright";

export default defineConfig({
	projectStructure: "v1",
	defaults: {
		resolution: [1920, 1080],
		fps: 60,
		aspectRatio: "16:9",
	},
	transitions: {
		"logo-morph": () => import("./transitions/logo-morph.js"),
	},
});
