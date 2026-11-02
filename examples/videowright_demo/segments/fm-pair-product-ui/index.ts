import { definePair } from "../../components/fm/pair.js";
import nowSrc from "../../videos/2026_11_five_months/footage/now_product_ui.webm";
import thenSrc from "../../videos/2026_11_five_months/footage/then_product_ui.webm";

export default definePair({
	id: "fm-pair-product-ui",
	thenSrc,
	nowSrc,
	captions: ["a dashboard that played itself", "a cursor, a panning camera, a real route change"],
	enteredFrom: "pair",
	voiceover:
		"Product UI was a dashboard that played itself. Now someone's using it: a cursor, a panning camera, a real route change.",
	notes:
		"Then: demo_video's Acme dashboard (KPIs count up, the tab switches itself). Now: demo_v2's Acme app from the cursor opening Customers (the camera frames the table, a note types, the toast). Advance 1: the sweep, 0.15s before 'Now'. Advance 2: exit, 0.15s before the narration-sync pair's 'In'.",
});
