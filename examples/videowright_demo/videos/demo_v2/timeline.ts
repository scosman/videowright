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
		// The instrument redraws: from the live preview to the shell that renders it.
		{ id: "v2-pixel-perfect-export", transition: "me-sweep" },
		// Into the video's internals: the camera pushes through the exported file to its script.
		{ id: "v2-voiceover-sync", transition: "me-push" },
		// The same story, a new readout: the agents it runs in.
		{ id: "v2-any-coding-agent", transition: "me-sweep" },
		// The close, on the video's one match cut: the agents' outline settles onto the end
		// card's prompt box, and the end card cuts in on it (any agent → your agent's input box).
		{ id: "v2-install-cta", transition: "cut" },
	],
	default_audio_track: defaultAudioTrack,
};

export default timeline;
