import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-ui-showcase",
	advances: [2.5, 5.0],
	voiceover:
		"UI showcases in Iso Diagram. An exploded isometric view with four stacked diamond layers, each drawing its outline then flooding with pastel fill.",

	mount(el) {
		host = el;

		const layers = [
			{ y: 360, fill: "var(--fill-blue)", label: "TIMELINE" },
			{ y: 240, fill: "var(--fill-yellow)", label: "MEMORY" },
			{ y: 120, fill: "var(--fill-pink)", label: "TRACES" },
			{ y: 0, fill: "var(--fill-green)", label: "AGENT" },
		];

		const layerHtml = layers
			.map(
				(layer, i) => `
        <g data-ref="layer${i}" transform="translate(80,${layer.y})">
          <polygon data-ref="layerFill${i}" points="0,80 360,-80 720,80 360,240" fill="${layer.fill}" opacity="0" />
          <path data-ref="layerOutline${i}" d="M 0 80 L 360 -80 L 720 80 L 360 240 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1800" stroke-dashoffset="1800" />
          <text data-ref="layerLabel${i}" x="760" y="70" font-family="var(--font-display)" font-size="44" fill="var(--color-fg)" opacity="0">${layer.label}</text>
          <path data-ref="layerTick${i}" d="M 740 60 L 800 60" stroke="var(--color-accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="60" stroke-dashoffset="60" />
        </g>`,
			)
			.join("");

		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(42,38,32,0.10) 1px, transparent 1.6px);
          background-size: 32px 32px;
        "></div>

        <div data-ref="heading" style="
          position: absolute;
          left: 140px;
          top: 120px;
          opacity: 0;
        ">
          <div style="font-family: var(--font-display); font-size: 110px;">Beacon Console.</div>
          <svg style="margin-top: 8px;" width="480" height="14">
            <path data-ref="headingUnderline" d="M 0 6 q 80 -8 160 0 t 160 0 t 160 0" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600" />
          </svg>
        </div>

        <svg style="position: absolute; left: 240px; top: 340px; overflow: visible;" width="1100" height="700">
          ${layerHtml}
        </svg>

        <div data-ref="caption" style="
          position: absolute;
          right: 140px;
          bottom: 180px;
          width: 480px;
          opacity: 0;
        ">
          <div style="font-family: var(--font-body); font-size: 26px; font-weight: 600;">Four layers, one console.</div>
          <div style="font-family: var(--font-body); font-size: 22px; margin-top: 8px; color: var(--color-muted);">Each layer is independently inspectable and pinnable to the timeline.</div>
        </div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 8 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const headingUnderline = host?.querySelector('[data-ref="headingUnderline"]') as SVGPathElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		heading.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 300 },
		);

		headingUnderline.animate([{ strokeDashoffset: "600" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 700,
		});

		// Each layer: outline draws on, fill floods, label + tick appear
		for (let i = 0; i < 4; i++) {
			const outline = host?.querySelector(`[data-ref="layerOutline${i}"]`) as SVGPathElement;
			const fill = host?.querySelector(`[data-ref="layerFill${i}"]`) as SVGPolygonElement;
			const label = host?.querySelector(`[data-ref="layerLabel${i}"]`) as SVGTextElement;
			const tick = host?.querySelector(`[data-ref="layerTick${i}"]`) as SVGPathElement;

			const base = 700 + i * 250;

			outline.animate([{ strokeDashoffset: "1800" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 500,
				delay: base,
			});

			fill.animate([{ opacity: 0 }, { opacity: 0.85 }], {
				...opts,
				duration: 400,
				delay: base + 400,
			});

			label.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 300,
				delay: base + 300,
			});

			tick.animate([{ strokeDashoffset: "60" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 300,
				delay: base + 300,
			});
		}

		caption.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) translateY(12px)" },
				{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 2500 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
