import "../../styles/motion-engineering-legacy/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v3/track.js";

const timeline: Timeline = {
	meta: {
		title: "Videowright Explainer",
		// Pinned to the frozen pre-upgrade snapshot so this video looks as it did before
		// motion-engineering was rebuilt for demo_v2.
		style: "motion-engineering-legacy",
	},
	default_audio_track: defaultAudioTrack,
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
