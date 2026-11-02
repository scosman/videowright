import { definePair } from "../../components/fm/pair.js";
import nowSrc from "../../videos/2026_11_five_months/footage/now_3d.webm";
import thenSrc from "../../videos/2026_11_five_months/footage/then_3d.webm";

export default definePair({
	id: "fm-pair-3d",
	thenSrc,
	nowSrc,
	captions: ["a spinning polygon", "a GPU-shaded planet"],
	enteredFrom: "pair",
	advances: [2.8, 9.4],
	voiceover:
		"3D was a spinning polygon. Now it's a planet, shaded on the GPU, with clouds and an atmosphere that follows the light.",
	notes:
		"Then: demo_video's Three.js + Lottie panel. Now: demo_v2's planet and Lottie card, from footage/v2_source.timeline.ts (the sub-beat held longer). Advance 1: the sweep, 0.15s before 'Now'. Advance 2: exit, 0.15s before the product UI pair's 'Product'.",
});
