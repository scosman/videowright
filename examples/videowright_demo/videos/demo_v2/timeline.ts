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
	],
	default_audio_track: defaultAudioTrack,
};

export default timeline;
