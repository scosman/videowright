import { defineSegment } from "videowright";

/**
 * Animate an SVG line's stroke-dashoffset from full to 0 using WAAPI.
 */
function animateLine(line: SVGLineElement, delay: number, duration: number): void {
	const length =
		Math.sqrt(
			(line.x2.baseVal.value - line.x1.baseVal.value) ** 2 +
				(line.y2.baseVal.value - line.y1.baseVal.value) ** 2,
		) || 200;
	line.style.strokeDasharray = `${length}`;
	line.style.strokeDashoffset = `${length}`;
	line.animate([{ strokeDashoffset: `${length}` }, { strokeDashoffset: "0" }], {
		duration,
		delay,
		fill: "forwards",
		easing: "cubic-bezier(0.16, 1, 0.3, 1)",
	});
}

/**
 * Animate an SVG circle radius from 0 to target using WAAPI on the r attribute.
 */
function animateCircle(circle: SVGCircleElement, targetR: number, delay: number): void {
	circle.setAttribute("r", "0");
	circle.animate([{ r: 0 }, { r: targetR }], {
		duration: 500,
		delay,
		fill: "forwards",
		easing: "cubic-bezier(0.16, 1, 0.3, 1)",
	});
}

/**
 * Fade in an SVG text element.
 */
function animateText(text: SVGTextElement, delay: number): void {
	text.style.opacity = "0";
	text.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration: 300,
		delay,
		fill: "forwards",
	});
}

export default defineSegment({
	id: "feature-svg",
	advances: [3.0],
	voiceover:
		"Animated SVG, drawn with web standards. Lines stroke in, nodes appear — zero dependencies.",

	mount(el) {
		el.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: #07070d;
			gap: 2rem;
		`;

		el.innerHTML = `
			<div style="font-family: Inter, system-ui, sans-serif; font-size: 1rem; font-weight: 600; color: #5c5c78; letter-spacing: 0.15em; text-transform: uppercase;">Pure SVG</div>
			<svg viewBox="0 0 600 400" width="700" height="467" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.15));" class="node-graph">
				<!-- Connection lines -->
				<line class="edge" x1="150" y1="200" x2="300" y2="100" stroke="#3b82f6" stroke-width="2" opacity="0.6" />
				<line class="edge" x1="150" y1="200" x2="300" y2="300" stroke="#8b5cf6" stroke-width="2" opacity="0.6" />
				<line class="edge" x1="300" y1="100" x2="450" y2="200" stroke="#10b981" stroke-width="2" opacity="0.6" />
				<line class="edge" x1="300" y1="300" x2="450" y2="200" stroke="#f59e0b" stroke-width="2" opacity="0.6" />

				<!-- Node 1: left -->
				<circle class="node" cx="150" cy="200" r="0" fill="#3b82f6" opacity="0.9" data-target-r="30" />
				<text class="label" x="150" y="207" text-anchor="middle" fill="#fff" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" style="opacity:0">SVG</text>

				<!-- Node 2: top center -->
				<circle class="node" cx="300" cy="100" r="0" fill="#8b5cf6" opacity="0.9" data-target-r="25" />
				<text class="label" x="300" y="107" text-anchor="middle" fill="#fff" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" style="opacity:0">CSS</text>

				<!-- Node 3: bottom center -->
				<circle class="node" cx="300" cy="300" r="0" fill="#10b981" opacity="0.9" data-target-r="25" />
				<text class="label" x="300" y="307" text-anchor="middle" fill="#fff" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" style="opacity:0">WAAPI</text>

				<!-- Node 4: right -->
				<circle class="node" cx="450" cy="200" r="0" fill="#f59e0b" opacity="0.9" data-target-r="30" />
				<text class="label" x="450" y="207" text-anchor="middle" fill="#fff" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" style="opacity:0">DOM</text>
			</svg>
			<div style="font-family: Inter, system-ui, sans-serif; font-size: 1.25rem; color: #f0f0f5; font-weight: 600; opacity: 0;" class="caption">
				Zero dependencies. Just web standards.
			</div>
		`;

		// Animate using WAAPI instead of declarative SVG <animate> for reliability
		const svg = el.querySelector(".node-graph") as SVGSVGElement;
		if (!svg) return;

		const lines = svg.querySelectorAll<SVGLineElement>(".edge");
		lines.forEach((line, i) => {
			animateLine(line, 300 + i * 200, 800);
		});

		const circles = svg.querySelectorAll<SVGCircleElement>(".node");
		circles.forEach((circle, i) => {
			const targetR = Number(circle.dataset.targetR) || 25;
			animateCircle(circle, targetR, 100 + i * 200);
		});

		const labels = svg.querySelectorAll<SVGTextElement>(".label");
		labels.forEach((text, i) => {
			animateText(text, 400 + i * 200);
		});

		const caption = el.querySelector(".caption") as HTMLElement;
		if (caption) {
			caption.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 500,
				delay: 1400,
				fill: "forwards",
				easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			});
		}
	},

	async play(ctx) {
		await ctx.hold(3000);
	},

	unmount() {
		// No resources to clean up; WAAPI animations are bound to DOM elements
		// which are cleared when the slot content is wiped.
	},
});
