import "../../styles/risograph/tokens.css";
import type { Timeline } from "videowright";
import defaultVoiceover from "./voiceovers/v2/voiceover.js";

const timeline: Timeline = {
	meta: {
		title: "Videowright Explainer — Risograph",
		style: "risograph",
	},
	default_voiceover: defaultVoiceover,
	segments: [
		{ id: "rs-cold-open" },
		{ id: "rs-title-card" },
		{ id: "rs-web-tech-gallery", transition: "fade" },
		{ id: "rs-interactive-dev", transition: "fade" },
		{ id: "rs-pixel-perfect-export", transition: "fade" },
		{ id: "rs-voiceover-sync", transition: "fade" },
		{ id: "rs-any-coding-agent", transition: "fade" },
		{ id: "rs-install-cta", transition: "fade" },
	],
};
export default timeline;
