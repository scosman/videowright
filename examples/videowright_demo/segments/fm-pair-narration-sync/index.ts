import { definePair } from "../../components/fm/pair.js";
import nowSrc from "../../videos/2026_11_five_months/footage/now_narration_sync.webm";
import thenSrc from "../../videos/2026_11_five_months/footage/then_narration_sync.webm";

export default definePair({
	id: "fm-pair-narration-sync",
	thenSrc,
	nowSrc,
	captions: ["synced by line", "timed to every word"],
	enteredFrom: "pair",
	advances: [3.167, 7.217],
	voiceover: "In May, narration sync was by line. Now, it's timed to every word.",
	notes:
		"Then: demo_video's voiceover-sync beat (the script view, the line highlighted). Now: demo_v2's, from the edit (words lit on their real times, block 06 re-times). Advance 1: the sweep, 0.15s before 'Now'. Advance 2: exit into the voice beat, after the Now clip's 4s hold.",
});
