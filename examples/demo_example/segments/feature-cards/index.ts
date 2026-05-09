import { defineSegment } from "videowright";
import { type FeatureCard, register as registerCard } from "../../components/feature-card/index.js";
import { palette } from "../../styles/tokens.js";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "feature-cards",
	advances: [1.5, 3.0, 4.5, 6.0],
	voiceover:
		"Videos compound. Segments, components, transitions, styles — all top-level, all reusable.",

	mount(el) {
		registerCard();
		host = el;

		el.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: var(--vw-bg-primary, ${palette.bgPrimary});
			gap: 2.5rem;
		`;

		el.innerHTML = `
			<div style="font-family: var(--vw-font-sans, Inter, system-ui, sans-serif); font-size: var(--vw-text-2xl, 2rem); font-weight: 700; color: var(--vw-text-primary, ${palette.textPrimary}); letter-spacing: -0.02em;">Why Videowright?</div>
			<div style="display: flex; gap: var(--vw-space-8, 2rem); align-items: stretch;">
				<feature-card
					icon="↔"
					card-title="Reorder segments"
					description="Move array entries in your timeline. That's it. No timeline editor, no drag-and-drop."
					accent="${palette.accentBlue}"
				></feature-card>
				<feature-card
					icon="♻"
					card-title="Reuse anything"
					description="Flat folder layout. Every segment, component, and style is top-level and shareable across videos."
					accent="${palette.accentGreen}"
				></feature-card>
				<feature-card
					icon="◆"
					card-title="Compounding style"
					description="Keep building on past videos. Your design tokens, components, and transitions grow with you."
					accent="${palette.accentPurple}"
				></feature-card>
			</div>
			<div class="logo" style="
				font-family: var(--vw-font-sans, Inter, system-ui, sans-serif);
				font-size: var(--vw-text-xl, 1.5rem);
				font-weight: 800;
				color: var(--vw-accent-blue, ${palette.accentBlue});
				margin-top: var(--vw-space-4, 1rem);
			">Videowright</div>
		`;
	},

	async play(ctx) {
		if (!host) return;
		const cards = host.querySelectorAll("feature-card");

		// Beat 1: reveal first card
		(cards[0] as FeatureCard)?.reveal();
		await ctx.waitForNext();

		// Beat 2: reveal second card
		(cards[1] as FeatureCard)?.reveal();
		await ctx.waitForNext();

		// Beat 3: reveal third card
		(cards[2] as FeatureCard)?.reveal();
		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
