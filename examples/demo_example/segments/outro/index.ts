import { defineSegment } from "videowright";
import { palette } from "../../styles/tokens.js";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "outro",
	advances: [3.0],
	voiceover: "Get started. Install Videowright, and let the agent build your first video.",

	mount(el) {
		host = el;
		el.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: radial-gradient(ellipse at 50% 40%, #111130 0%, ${palette.bgPrimary} 70%);
			gap: var(--vw-space-8, 2rem);
			overflow: hidden;
		`;

		el.innerHTML = `
			<div class="logo" style="
				font-family: var(--vw-font-sans, Inter, system-ui, sans-serif);
				font-size: var(--vw-text-4xl, 3.5rem);
				font-weight: 800;
				color: var(--vw-accent-blue, ${palette.accentBlue});
				letter-spacing: -0.03em;
				opacity: 0;
			">Videowright</div>
			<div style="
				font-family: var(--vw-font-sans, Inter, system-ui, sans-serif);
				font-size: var(--vw-text-xl, 1.5rem);
				font-weight: 500;
				color: var(--vw-text-primary, ${palette.textPrimary});
				opacity: 0;
			" class="get-started">Get started</div>
			<div class="code-block" style="
				background: var(--vw-bg-surface, ${palette.bgSurface});
				border: 1px solid rgba(255, 255, 255, 0.08);
				border-radius: var(--vw-radius-lg, 0.75rem);
				padding: 1.25rem 2rem;
				font-family: var(--vw-font-mono, 'JetBrains Mono', 'Fira Code', ui-monospace, monospace);
				font-size: 1.1rem;
				color: var(--vw-accent-green, ${palette.accentGreen});
				opacity: 0;
				box-shadow: var(--vw-shadow-glow-green, 0 0 40px rgba(16, 185, 129, 0.15));
			">npm install videowright</div>
			<div style="
				font-family: var(--vw-font-sans, Inter, system-ui, sans-serif);
				font-size: var(--vw-text-base, 1rem);
				color: var(--vw-text-muted, ${palette.textMuted});
				margin-top: var(--vw-space-4, 1rem);
				opacity: 0;
			" class="tagline">Videos in HTML, CSS, and JavaScript.</div>
		`;

		const logo = el.querySelector(".logo") as HTMLElement;
		const getStarted = el.querySelector(".get-started") as HTMLElement;
		const codeBlock = el.querySelector(".code-block") as HTMLElement;
		const tagline = el.querySelector(".tagline") as HTMLElement;

		logo?.animate(
			[
				{ opacity: 0, transform: "scale(0.9)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{
				duration: 600,
				delay: 200,
				fill: "forwards",
				easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			},
		);

		getStarted?.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 400,
			delay: 600,
			fill: "forwards",
		});

		codeBlock?.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{
				duration: 500,
				delay: 900,
				fill: "forwards",
				easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			},
		);

		tagline?.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 400,
			delay: 1300,
			fill: "forwards",
		});
	},

	async play(ctx) {
		await ctx.hold(2000);
	},

	unmount() {
		host = null;
	},
});
