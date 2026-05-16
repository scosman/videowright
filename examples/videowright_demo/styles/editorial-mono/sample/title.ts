import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-title",
	advances: [2.0, 5.0],
	voiceover:
		"The Editorial Mono title card. Cream paper, serif display, a red period that lands at the end.",

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
          position: absolute;
          left: var(--safe-x);
          top: var(--safe-y);
          right: var(--safe-x);
          height: 1px;
          background: var(--color-border);
        "></div>

        <div style="position: absolute; left: var(--safe-x); top: 240px;">
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 48px;
            opacity: 0;
          ">Vol. 01 / 2026</div>

          <div data-ref="headline" style="
            font-family: var(--font-display);
            font-size: 200px;
            line-height: 0.98;
            letter-spacing: -0.01em;
            opacity: 0;
          ">Sample<span style="color: var(--color-accent); font-style: italic;">.</span></div>

          <div data-ref="subtitle" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 40px;
            margin-top: 56px;
            opacity: 0;
          ">A demonstration of the editorial register.</div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";

		label.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 480,
			fill: "forwards",
			easing: ease,
		});

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 480, delay: 480, fill: "forwards", easing: ease },
		);

		subtitle.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 480, delay: 560, fill: "forwards", easing: ease },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
