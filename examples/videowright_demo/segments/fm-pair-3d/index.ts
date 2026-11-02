import { definePair } from "../../components/fm/pair.js";
import nowSrc from "../../videos/2026_11_five_months/footage/now_3d.webm";
import thenSrc from "../../videos/2026_11_five_months/footage/then_3d.webm";

export default definePair({
	id: "fm-pair-3d",
	thenSrc,
	nowSrc,
	captions: ["a simple shape", "real-time scenes on the GPU"],
	enteredFrom: "pair",
	voiceover: "3D was a simple shape. Now, it renders real-time scenes on the GPU.",
	notes:
		"Then: demo_video's Three.js + Lottie panel. Now: demo_v2's planet and Lottie card, from footage/v2_source.timeline.ts (the sub-beat held longer). Advance 1: the sweep, 0.15s before 'Now'. Advance 2: exit, 0.15s before the product UI pair's 'Product'.",
});
