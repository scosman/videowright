import { definePair } from "../../components/fm/pair.js";
import nowSrc from "../../videos/2026_11_five_months/footage/now_title_card.webm";
import thenSrc from "../../videos/2026_11_five_months/footage/then_title_card.webm";

export default definePair({
	id: "fm-pair-title-card",
	thenSrc,
	nowSrc,
	captions: ["designs were basic", "rich animations and graphics"],
	enteredFrom: "title",
	voiceover: "In May, designs were basic. Now, it uses rich animations and graphics.",
	notes:
		"Then: demo_video's title card. Now: demo_v2's, from its hard cut (the bloom and the first stroke). Advance 1: the sweep, 0.15s before 'Now'. Advance 2: exit, 0.15s before the 3D pair's '3D'.",
});
