import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-kinetic",
	advances: [2.5, 4.5],
	voiceover:
		"Kinetic statements in Swiss Console. One sentence at large grotesk size, last word in red, sliding in from the right.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        overflow: hidden;
      ">
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: 56px; height: 1px; background: var(--color-border);"></div>
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 56px; height: 1px; background: var(--color-border);"></div>

        <div data-ref="label" style="
          position: absolute;
          left: var(--safe-x);
          top: 200px;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">Statement 03</div>

        <div style="
          position: absolute;
          left: var(--safe-x);
          top: 300px;
          max-width: 1500px;
          font-family: var(--font-display);
          font-size: 96px;
          font-weight: 500;
          line-height: 1.05;
          display: flex;
          flex-wrap: wrap;
          column-gap: 32px;
          row-gap: 6px;
        ">
          <span data-ref="w0" style="opacity: 0;">Most</span>
          <span data-ref="w1" style="opacity: 0;">agents</span>
          <span data-ref="w2" style="opacity: 0;">fail</span>
          <span data-ref="w3" style="opacity: 0;">because</span>
          <span data-ref="w4" style="opacity: 0;">they</span>
          <span data-ref="w5" style="opacity: 0; color: var(--color-accent);">forget.</span>
        </div>

        <div data-ref="source" style="
          position: absolute;
          left: var(--safe-x);
          bottom: 120px;
          opacity: 0;
        ">
          <div style="width: 400px; height: 1px; background: var(--color-fg); margin-bottom: 16px;"></div>
          <div style="
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-muted);
          ">Source: Internal failure-mode taxonomy, Q1 2026</div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const source = host?.querySelector('[data-ref="source"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		for (let i = 0; i < 6; i++) {
			const word = host?.querySelector(`[data-ref="w${i}"]`) as HTMLElement;
			word.animate(
				[
					{ opacity: 0, transform: "translateX(32px)" },
					{ opacity: 1, transform: "translateX(0)" },
				],
				{ ...opts, duration: 360, delay: 60 + i * 60 },
			);
		}

		source.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 600 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
