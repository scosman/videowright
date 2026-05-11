import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-bullet",
	advances: [2.5, 5.0],
	voiceover:
		"Bullet reveals in Iso Diagram. Each item has a hand-drawn checkbox that draws itself, then a checkmark appears inside.",

	mount(el) {
		host = el;

		const items = [
			"Context windows decay.",
			"Tool selection drifts.",
			"Plans go stale.",
			"Errors compound.",
			"Recovery requires restart.",
		];

		const itemHtml = items
			.map(
				(text, i) => `
        <div data-ref="item${i}" style="
          display: flex;
          align-items: center;
          gap: 36px;
          margin-bottom: 40px;
          opacity: 0;
        ">
          <svg width="64" height="64" style="flex-shrink: 0; overflow: visible;">
            <path data-ref="box${i}" d="M 8 8 L 56 8 L 56 56 L 8 56 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="200" stroke-dashoffset="200" />
            <path data-ref="check${i}" d="M 16 32 L 28 48 L 52 16" stroke="var(--color-accent)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="80" stroke-dashoffset="80" />
          </svg>
          <span style="font-family: var(--font-body); font-size: 50px; font-weight: 600;">${text}</span>
          <span style="font-family: var(--font-display); font-size: 44px; color: var(--color-muted); margin-left: auto;">0${i + 1}.</span>
        </div>`,
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
          <div style="font-family: var(--font-display); font-size: 130px;">Where agents break.</div>
          <svg style="margin-top: 8px;" width="580" height="14">
            <path data-ref="headingUnderline" d="M 0 6 q 96 -8 192 0 t 192 0 t 192 0" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="700" stroke-dashoffset="700" />
          </svg>
        </div>

        <div style="position: absolute; left: 180px; top: 400px; right: 180px;">
          ${itemHtml}
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
        ">~ scene 4 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const headingUnderline = host?.querySelector('[data-ref="headingUnderline"]') as SVGPathElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		// Heading swings in
		heading.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 300 },
		);

		// Heading underline draws on
		headingUnderline.animate([{ strokeDashoffset: "700" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 700,
		});

		// Each item appears with checkbox drawing on, then checkmark
		for (let i = 0; i < 5; i++) {
			const item = host?.querySelector(`[data-ref="item${i}"]`) as HTMLElement;
			const box = host?.querySelector(`[data-ref="box${i}"]`) as SVGPathElement;
			const check = host?.querySelector(`[data-ref="check${i}"]`) as SVGPathElement;

			item.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 250,
				delay: 900 + i * 200,
			});

			box.animate([{ strokeDashoffset: "200" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 400,
				delay: 950 + i * 200,
			});

			check.animate([{ strokeDashoffset: "80" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 400,
				delay: 1250 + i * 200,
			});
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
