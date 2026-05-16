import "../../styles/editorial-mono/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v1/track.js";

const timeline: Timeline = {
	meta: {
		title: "Hello Videowright",
	},
	segments: [
		{ id: "hello-intro" },
		{ id: "editorial-mono-sample-kinetic", transition: "fade" },
		{ id: "hello-outro", transition: "fade" },
	],
	default_audio_track: defaultAudioTrack,
};

export default timeline;
