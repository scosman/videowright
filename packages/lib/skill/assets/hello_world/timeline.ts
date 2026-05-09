import "../../styles/placeholder/tokens.css";
import type { Timeline } from "videowright";

const timeline: Timeline = {
	meta: {
		title: "Hello Videowright",
	},
	segments: [
		{ id: "hello-intro" },
		{ id: "placeholder-sample", transition: "fade" },
		{ id: "hello-outro", transition: "fade" },
	],
};

export default timeline;
