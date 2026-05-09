/**
 * <feature-card> web component
 *
 * A card with an icon slot, title, and description. Designed to animate in
 * via WAAPI from the segment that uses it.
 */

const STYLES = `
	:host {
		display: block;
		width: 320px;
		opacity: 0;
		transform: translateY(24px);
	}

	.card {
		background: #1a1a26;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06);
		transition: border-color 0.3s ease;
	}

	.card:hover {
		border-color: rgba(59, 130, 246, 0.3);
	}

	.icon {
		width: 48px;
		height: 48px;
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
	}

	.title {
		font-family: "Inter", system-ui, sans-serif;
		font-size: 1.25rem;
		font-weight: 700;
		color: #f0f0f5;
		letter-spacing: -0.01em;
	}

	.description {
		font-family: "Inter", system-ui, sans-serif;
		font-size: 1rem;
		font-weight: 400;
		color: #9898b0;
		line-height: 1.6;
	}
`;

export class FeatureCard extends HTMLElement {
	private shadow: ShadowRoot;

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
	}

	/**
	 * Validate that a string is a CSS hex color value.
	 * The accent attribute is interpolated into a <style> block inside shadow DOM.
	 * This must never accept untrusted input -- only valid hex colors are allowed.
	 */
	private static isValidHexColor(value: string): boolean {
		return /^#[0-9a-fA-F]{3,8}$/.test(value);
	}

	connectedCallback() {
		const icon = this.getAttribute("icon") ?? "";
		const title = this.getAttribute("card-title") ?? "";
		const description = this.getAttribute("description") ?? "";
		const rawAccent = this.getAttribute("accent") ?? "#3b82f6";
		const accentColor = FeatureCard.isValidHexColor(rawAccent) ? rawAccent : "#3b82f6";

		this.shadow.innerHTML = `
			<style>
				${STYLES}
				.icon { background: ${accentColor}1f; color: ${accentColor}; }
			</style>
			<div class="card">
				<div class="icon">${icon}</div>
				<div class="title">${title}</div>
				<div class="description">${description}</div>
			</div>
		`;
	}

	reveal() {
		this.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{
				duration: 500,
				easing: "cubic-bezier(0.16, 1, 0.3, 1)",
				fill: "forwards",
			},
		);
	}
}

export function register() {
	if (!customElements.get("feature-card")) {
		customElements.define("feature-card", FeatureCard);
	}
}
