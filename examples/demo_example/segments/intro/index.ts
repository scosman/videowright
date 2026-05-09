import { defineSegment } from "videowright";
import { register as registerTitle } from "../../components/animated-title/index.js";
// Import CSS tokens so custom properties are available to all segments.
// Vite injects this as a <style> tag into the document head.
import "../../styles/tokens.css";

export default defineSegment({
	id: "intro",
	advances: [3.0],
	voiceover: "Videowright. Build videos in the same HTML, CSS, and JavaScript you build apps with.",

	mount(el) {
		registerTitle();

		el.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: radial-gradient(ellipse at 50% 40%, #111130 0%, #07070d 70%);
			overflow: hidden;
		`;

		el.innerHTML = `
			<animated-title
				text="Videowright"
				subtitle="Videos in HTML, CSS, and JavaScript"
				accent="#3b82f6"
			></animated-title>
		`;
	},

	async play(ctx) {
		await ctx.hold(3000);
	},

	unmount() {
		// No resources to clean up.
	},
});
