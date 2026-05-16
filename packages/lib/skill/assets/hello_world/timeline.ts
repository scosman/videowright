import "../../styles/editorial-mono/tokens.css";
import type { Timeline } from "videowright";

const timeline: Timeline = {
	meta: {
		title: "Hello Videowright",
	},
	segments: [
		{ id: "hello-intro" },
		{ id: "editorial-mono-sample-kinetic", transition: "fade" },
		{ id: "hello-outro", transition: "fade" },
	],
};

export default timeline;
