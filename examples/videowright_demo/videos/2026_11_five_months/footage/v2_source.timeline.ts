import "../../../styles/motion-engineering/tokens.css";
import type { Timeline } from "videowright";

// Source footage for the "Now" clips: demo_v2's own segments, rendered silent with demo_v2's
// track timing (videos/demo_v2/audio/tracks/v1/track.ts), with one change: the gallery's 3D +
// Lottie sub-beat is held 3.4s longer (advances [2] onward shifted), because the 3D pair's Now
// narration runs ~6.6s and the shipped beat is 4.1s. Same scene and code, running longer: the
// planet keeps turning and the rocket launches later. Only the beats the pairs use are here.
// Render: node ../../packages/lib/dist/cli/bin.js render videos/2026_11_five_months/footage/v2_source.timeline.ts
const timeline: Timeline = {
	meta: { title: "2026_11_five_months: demo_v2 source footage" },
	segments: [
		{ id: "v2-title-card" },
		{ id: "v2-web-tech-gallery", transition: "me-push" },
		{ id: "v2-voiceover-sync", transition: "cut" },
	],
	default_timing: {
		perSegment: {
			"v2-title-card": [0.467, 2.583, 5.45, 5.967],
			// demo_v2: [2.683, 5.417, 8.4, 9.5, 11.417, 15.367, 18.15]
			"v2-web-tech-gallery": [2.683, 5.417, 10.4, 12.9, 14.817, 18.767, 21.55],
			"v2-voiceover-sync": [2.533, 5.433, 6.917, 8.917],
		},
	},
};

export default timeline;
