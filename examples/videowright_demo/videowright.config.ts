import { defineConfig } from "videowright";

export default defineConfig({
	projectStructure: "v1",
	defaultStyle: "motion-engineering",
	defaults: {
		resolution: [1920, 1080],
		fps: 60,
		aspectRatio: "16:9",
	},
	transitions: {
		// Motion Engineering transitions: verified copies of the recipes in
		// styles/motion-engineering/STYLE.md.
		"me-sweep": () => import("./transitions/me-sweep.js"),
		"me-push": () => import("./transitions/me-push.js"),
		// demo_v2's split-screen entrance (beat 4): the sweep, opened from the split line.
		"me-split": () => import("./transitions/me-split.js"),
	},
});
