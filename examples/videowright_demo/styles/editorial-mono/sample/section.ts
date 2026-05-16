import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-section",
	advances: [2.0, 4.0],
	voiceover: "Section headers in Editorial Mono. Centered italic serif between two hairline rules.",

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
        gap: 56px;
        overflow: hidden;
      ">
        <div data-ref="label" style="
          font-family: var(--font-mono);
          font-size: 18px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">Chapter One</div>

        <div data-ref="rule-top" style="
          width: 240px;
          height: 1px;
          background: var(--color-border);
          opacity: 0;
        "></div>

        <div data-ref="headline" style="
          font-family: var(--font-display);
          font-style: italic;
          font-size: 140px;
          line-height: 0.98;
          text-align: center;
          opacity: 0;
        ">The Problem</div>

        <div data-ref="rule-bottom" style="
          width: 240px;
          height: 1px;
          background: var(--color-border);
          opacity: 0;
        "></div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const ruleTop = host?.querySelector('[data-ref="rule-top"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const ruleBottom = host?.querySelector('[data-ref="rule-bottom"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		ruleTop.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 150 },
		);

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 300 },
		);

		ruleBottom.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 550 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
