import "../../styles/motion-engineering/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v2/track.js";

// 5 months of progress in Claude video generation. Every pair is the same comparison rig at the
// same pixels (components/fm/rig.ts), so pairs are joined by hard cuts: only the footage changes.
const timeline: Timeline = {
	meta: {
		title: "5 months of progress in Claude video generation",
	},
	segments: [
		{ id: "fm-title" },
		// The title's rail is already where the rig's rail is: the cut fills the window.
		{ id: "fm-pair-title-card", transition: "cut" },
		{ id: "fm-pair-3d", transition: "cut" },
		{ id: "fm-pair-product-ui", transition: "cut" },
		{ id: "fm-pair-narration-sync", transition: "cut" },
		// The voice beat is the rig too: the window holds the voice instrument instead of footage.
		{ id: "fm-voice", transition: "cut" },
		// Out of the rig: the instrument redraws into the close.
		{ id: "fm-cta", transition: "me-sweep" },
	],
	default_audio_track: defaultAudioTrack,
};

export default timeline;
