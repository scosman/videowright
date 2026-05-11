import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-cta",
	advances: [2.5, 5.0],
	voiceover:
		"CTA cards in Iso Diagram. A hand-drawn rectangle draws itself on screen, then the call-to-action text appears inside with a small isometric icon below.",

	mount(el) {
		host = el;
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

        <div data-ref="prompt" style="
          position: absolute;
          left: 0;
          right: 0;
          top: 240px;
          text-align: center;
          font-family: var(--font-display);
          font-size: 56px;
          color: var(--color-muted);
          opacity: 0;
          transform: rotate(-1deg);
        ">Try it</div>

        <div style="position: absolute; left: 50%; top: 380px; transform: translateX(-50%);">
          <svg width="1100" height="280" style="overflow: visible;">
            <path data-ref="ctaBox" d="M 20 40 L 1080 30 L 1060 240 L 30 230 Z" stroke="var(--color-accent)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3000" stroke-dashoffset="3000" />
          </svg>
          <div data-ref="ctaText" style="
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-display);
            font-size: 160px;
            color: var(--color-accent);
            opacity: 0;
          ">beacon.run</div>
        </div>

        <svg data-ref="iconSvg" style="position: absolute; left: 50%; top: 720px; transform: translateX(-50%); overflow: visible; opacity: 0;" width="240" height="240">
          <g transform="translate(40,40)">
            <polygon data-ref="iconTop" points="0,35 70,0 140,35 70,70" fill="var(--fill-yellow)" opacity="0" />
            <polygon data-ref="iconLeft" points="0,35 70,70 70,105 0,70" fill="var(--fill-yellow)" opacity="0" />
            <polygon data-ref="iconRight" points="70,70 140,35 140,70 70,105" fill="var(--fill-yellow)" opacity="0" />
            <path data-ref="iconOutline" d="M0,35 L70,0 L140,35 L70,70 Z M0,35 L70,70 L70,105 L0,70 Z M70,70 L140,35 L140,70 L70,105" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="600" stroke-dashoffset="600" />
          </g>
        </svg>

        <div data-ref="tagline" style="
          position: absolute;
          left: 0;
          right: 0;
          bottom: 100px;
          text-align: center;
          font-family: var(--font-display);
          font-size: 40px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ beacon &middot; may 2026 ~</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 10 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const prompt = host?.querySelector('[data-ref="prompt"]') as HTMLElement;
		const ctaBox = host?.querySelector('[data-ref="ctaBox"]') as SVGPathElement;
		const ctaText = host?.querySelector('[data-ref="ctaText"]') as HTMLElement;
		const iconSvg = host?.querySelector('[data-ref="iconSvg"]') as SVGElement;
		const iconOutline = host?.querySelector('[data-ref="iconOutline"]') as SVGPathElement;
		const iconTop = host?.querySelector('[data-ref="iconTop"]') as SVGPolygonElement;
		const iconLeft = host?.querySelector('[data-ref="iconLeft"]') as SVGPolygonElement;
		const iconRight = host?.querySelector('[data-ref="iconRight"]') as SVGPolygonElement;
		const tagline = host?.querySelector('[data-ref="tagline"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		// Prompt swings in
		prompt.animate(
			[
				{ opacity: 0, transform: "rotate(-3deg) translateY(12px)" },
				{ opacity: 1, transform: "rotate(-1deg) translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		// CTA box draws on
		ctaBox.animate([{ strokeDashoffset: "3000" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 900,
			delay: 500,
		});

		// CTA text appears inside
		ctaText.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 1200 },
		);

		// Small iso icon: outline draws then fills flood
		iconSvg.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200, delay: 1600 });
		iconOutline.animate([{ strokeDashoffset: "600" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 1600,
		});
		iconTop.animate([{ opacity: 0 }, { opacity: 0.95 }], { ...opts, duration: 400, delay: 2000 });
		iconLeft.animate([{ opacity: 0 }, { opacity: 0.7 }], { ...opts, duration: 400, delay: 2050 });
		iconRight.animate([{ opacity: 0 }, { opacity: 0.55 }], { ...opts, duration: 400, delay: 2050 });

		// Tagline
		tagline.animate(
			[
				{ opacity: 0, transform: "rotate(-4deg) translateY(8px)" },
				{ opacity: 1, transform: "rotate(-2deg) translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 2200 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
