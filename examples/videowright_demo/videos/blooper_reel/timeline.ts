import "../../styles/motion-engineering-legacy/tokens.css";
import type { Timeline } from "videowright";
import defaultAudioTrack from "./audio/tracks/v1/track.js";

// Videowright — The Bloopers.
// A gag reel of "making" the videowright_demo explainer: the narrator keeps
// flubbing lines and the demo keeps breaking on camera. The narrator's fumbled
// "scratch takes" are carried by the ElevenLabs voiceover (track v1) — voice
// only, no on-screen subtitles. Hard jump-cuts between takes for that
// raw-dailies feel; each segment opens on its own director's slate.
const timeline: Timeline = {
	meta: {
		title: "Videowright — The Bloopers",
		// Pinned to the frozen pre-upgrade snapshot so this video looks as it did before
		// motion-engineering was rebuilt for demo_v2.
		style: "motion-engineering-legacy",
	},
	default_audio_track: defaultAudioTrack,
	segments: [
		{ id: "bl-cold-open" },
		{ id: "bl-title-card" },
		{ id: "bl-web-tech-gallery" },
		{ id: "bl-interactive-dev" },
		{ id: "bl-pixel-perfect-export" },
		{ id: "bl-voiceover-sync" },
		{ id: "bl-any-coding-agent" },
		{ id: "bl-install-cta" },
		{ id: "bl-gag-reel-outro" },
	],
};
export default timeline;
