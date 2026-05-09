/**
 * <animated-title> web component
 *
 * Staggers letter reveals using CSS keyframes. Each letter fades in and slides up
 * with a staggered delay. Supports a `subtitle` attribute for a secondary line.
 */

const STYLES = `
	:host {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		font-family: "Inter", system-ui, -apple-system, sans-serif;
	}

	.title {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.15em;
		font-size: 4.5rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	.letter {
		display: inline-block;
		opacity: 0;
		transform: translateY(30px);
		animation: letterIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	.subtitle {
		font-size: 1.5rem;
		font-weight: 400;
		color: #9898b0;
		opacity: 0;
		animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes letterIn {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
`;

export class AnimatedTitle extends HTMLElement {
	private shadow: ShadowRoot;

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
	}

	connectedCallback() {
		const text = this.getAttribute("text") ?? "Videowright";
		const subtitle = this.getAttribute("subtitle") ?? "";
		const accentColor = this.getAttribute("accent") ?? "#3b82f6";

		const letters = text.split("").map((char, i) => {
			const isSpace = char === " ";
			const delay = i * 60;
			const color = i < text.indexOf(" ") || text.indexOf(" ") === -1 ? accentColor : "#f0f0f5";
			if (isSpace) return '<span style="width: 0.3em; display: inline-block;">&nbsp;</span>';
			return `<span class="letter" style="animation-delay: ${delay}ms; color: ${color};">${char}</span>`;
		});

		const subtitleDelay = text.length * 60 + 200;

		this.shadow.innerHTML = `
			<style>${STYLES}</style>
			<div class="title">${letters.join("")}</div>
			${subtitle ? `<div class="subtitle" style="animation-delay: ${subtitleDelay}ms;">${subtitle}</div>` : ""}
		`;
	}
}

export function register() {
	if (!customElements.get("animated-title")) {
		customElements.define("animated-title", AnimatedTitle);
	}
}
