import type { Timeline } from "videowright";

const timeline: Timeline = {
	meta: {
		title: "Videowright — Demo",
		aspectRatio: "16:9",
		resolution: [1920, 1080],
		fps: 60,
	},
	segments: [
		{ id: "intro", transition: "fade" },
		{ id: "feature-svg", transition: "slideLeft" },
		{ id: "feature-three", transition: "slideLeft" },
		{ id: "feature-lottie", transition: "slideLeft" },
		{ id: "feature-echarts", transition: "slideLeft" },
		{ id: "feature-cards", transition: "logo-morph" },
		{ id: "outro" },
	],
};

export default timeline;
