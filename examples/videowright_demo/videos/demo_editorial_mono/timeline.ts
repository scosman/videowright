import "../../styles/editorial-mono/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v1/track.js";

const timeline: Timeline = {
	meta: {
		title: "Videowright Explainer — Editorial Mono",
		style: "editorial-mono",
	},
	default_audio_track: defaultAudioTrack,
	segments: [
		{ id: "em-cold-open" },
		{ id: "em-title-card" },
		{ id: "em-web-tech-gallery", transition: "fade" },
		{ id: "em-interactive-dev", transition: "fade" },
		{ id: "em-pixel-perfect-export", transition: "fade" },
		{ id: "em-voiceover-sync", transition: "fade" },
		{ id: "em-any-coding-agent", transition: "fade" },
		{ id: "em-install-cta", transition: "fade" },
	],
};
export default timeline;
