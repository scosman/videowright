import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-section",
	advances: [1.5, 4.0],
	voiceover:
		"Section headers in Swiss Console. A large centered numeral above the section name, framed by hairline rules.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      ">
        <div data-ref="label" style="
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
          margin-bottom: 48px;
          opacity: 0;
        ">Part 02 of 04</div>

        <div data-ref="rule-top" style="
          width: 600px;
          height: 1px;
          background: var(--color-fg);
          margin-bottom: 56px;
          opacity: 0;
        "></div>

        <div data-ref="numeral" style="
          font-family: var(--font-display);
          font-size: 280px;
          font-weight: 500;
          line-height: 0.9;
          font-variant-numeric: tabular-nums;
          margin-bottom: 36px;
          opacity: 0;
        ">02</div>

        <div data-ref="name" style="
          font-family: var(--font-display);
          font-size: 64px;
          font-weight: 500;
          margin-bottom: 56px;
          opacity: 0;
        ">The Architecture<span style="color: var(--color-accent);">.</span></div>

        <div data-ref="rule-bottom" style="
          width: 600px;
          height: 1px;
          background: var(--color-fg);
          opacity: 0;
        "></div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const ruleTop = host?.querySelector('[data-ref="rule-top"]') as HTMLElement;
		const numeral = host?.querySelector('[data-ref="numeral"]') as HTMLElement;
		const name = host?.querySelector('[data-ref="name"]') as HTMLElement;
		const ruleBottom = host?.querySelector('[data-ref="rule-bottom"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateY(-24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360 },
		);

		ruleTop.animate(
			[
				{ opacity: 0, transform: "scaleX(0)" },
				{ opacity: 1, transform: "scaleX(1)" },
			],
			{ ...opts, duration: 360, delay: 60 },
		);

		numeral.animate(
			[
				{ opacity: 0, transform: "translateY(32px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 120 },
		);

		name.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 180 },
		);

		ruleBottom.animate(
			[
				{ opacity: 0, transform: "scaleX(0)" },
				{ opacity: 1, transform: "scaleX(1)" },
			],
			{ ...opts, duration: 360, delay: 240 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
