import "../../styles/motion-engineering/tokens.css";
import type { Timeline } from "videowright";
import defaultVoiceover from "./voiceovers/v4/voiceover.js";

const timeline: Timeline = {
	meta: {
		title: "Videowright Explainer",
	},
	default_voiceover: defaultVoiceover,
	segments: [
		{ id: "cold-open" },
		{ id: "title-card" },
		{ id: "web-tech-gallery", transition: "fade" },
		{ id: "interactive-dev", transition: "fade" },
		{ id: "pixel-perfect-export", transition: "fade" },
		{ id: "voiceover-sync", transition: "fade" },
		{ id: "any-coding-agent", transition: "fade" },
		{ id: "install-cta", transition: "fade" },
	],
};
export default timeline;
