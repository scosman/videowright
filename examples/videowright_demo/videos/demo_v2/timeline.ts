import "../../styles/motion-engineering/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v1/track.js";

const timeline: Timeline = {
	meta: {
		title: "Videowright demo v2",
	},
	segments: [
		{ id: "v2-cold-open" },
		// The hook lands on the hard cut: from a real terminal into the instrument world.
		{ id: "v2-title-card", transition: "cut" },
		// Into the examples: the camera pushes through the title into the gallery.
		{ id: "v2-web-tech-gallery", transition: "me-push" },
		// Into the dev loop: the sweep opens from the split screen's divider.
		{ id: "v2-interactive-dev", transition: "me-split" },
	],
	default_audio_track: defaultAudioTrack,
};

export default timeline;
