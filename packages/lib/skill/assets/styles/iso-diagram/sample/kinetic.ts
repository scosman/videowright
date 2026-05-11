import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-kinetic",
	advances: [2.5, 5.0],
	voiceover:
		"Kinetic statements in Iso Diagram. Words appear one at a time in handwriting, the last circled with a hand-drawn ellipse.",

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

        <div style="
          position: absolute;
          left: 140px;
          top: 280px;
          width: 1640px;
          display: flex;
          flex-wrap: wrap;
          column-gap: 32px;
          row-gap: 12px;
          font-family: var(--font-display);
          font-size: 200px;
          line-height: 1.05;
        ">
          <span data-ref="w0" style="opacity: 0; display: inline-block;">Most</span>
          <span data-ref="w1" style="opacity: 0; display: inline-block;">agents</span>
          <span data-ref="w2" style="opacity: 0; display: inline-block;">fail</span>
          <span data-ref="w3" style="opacity: 0; display: inline-block;">because</span>
          <span data-ref="w4" style="opacity: 0; display: inline-block;">they</span>
          <span data-ref="w5" style="opacity: 0; display: inline-block; position: relative; color: var(--color-accent);">forget.
            <svg data-ref="ellipse" style="position: absolute; inset: -28px; width: calc(100% + 56px); height: calc(100% + 56px); overflow: visible;">
              <path data-ref="ellipsePath" d="M 20 100 q 0 -95 150 -95 t 150 95 t -150 95 t -150 -95 Z" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="1000" stroke-dashoffset="1000" />
            </svg>
          </span>
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
        ">~ scene 3 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;
		const ellipsePath = host?.querySelector('[data-ref="ellipsePath"]') as SVGPathElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		// Words swing in one at a time with slight alternating rotation
		for (let i = 0; i < 6; i++) {
			const word = host?.querySelector(`[data-ref="w${i}"]`) as HTMLElement;
			const rot = i % 2 === 0 ? -1.5 : 1.5;
			word.animate(
				[
					{ opacity: 0, transform: `rotate(${rot}deg) translateY(12px)` },
					{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
				],
				{ ...opts, duration: 300, delay: 400 + i * 220 },
			);
		}

		// Ellipse draws on around the last word
		ellipsePath.animate([{ strokeDashoffset: "1000" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 700,
			delay: 1800,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
