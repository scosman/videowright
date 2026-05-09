import lottie from "lottie-web";
import type { AnimationItem } from "lottie-web";
import { defineSegment } from "videowright";
import rocketData from "./rocket-launch.json";

let host: HTMLElement | null = null;
let animation: AnimationItem | null = null;

export default defineSegment({
	id: "feature-lottie",
	advances: [3.0],
	voiceover: "Lottie for designer-made motion. Export from After Effects, play inside a segment.",

	mount(el) {
		host = el;
		el.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: radial-gradient(ellipse at 50% 60%, #0c1025 0%, #07070d 70%);
			gap: 2rem;
		`;

		el.innerHTML = `
			<div style="font-family: Inter, system-ui, sans-serif; font-size: 1rem; font-weight: 600; color: #5c5c78; letter-spacing: 0.15em; text-transform: uppercase;">Lottie</div>
			<div class="lottie-container" style="width: 420px; height: 420px;"></div>
			<div style="font-family: Inter, system-ui, sans-serif; font-size: 1.25rem; color: #f0f0f5; font-weight: 600;">Designer-made motion, pixel-perfect.</div>
		`;
	},

	async play(ctx) {
		if (!host) return;
		const container = host.querySelector(".lottie-container") as HTMLElement;
		if (!container) return;

		animation = lottie.loadAnimation({
			container,
			renderer: "svg",
			loop: true,
			autoplay: true,
			animationData: rocketData,
		});

		ctx.signal.addEventListener("abort", () => {
			animation?.destroy();
			animation = null;
		});

		await ctx.hold(3000);
	},

	unmount() {
		if (animation) {
			animation.destroy();
			animation = null;
		}
		host = null;
	},
});
