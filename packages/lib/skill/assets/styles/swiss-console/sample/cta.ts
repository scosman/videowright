import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-cta",
	advances: [2.0, 4.0],
	voiceover:
		"CTA cards in Swiss Console. Micro-label top-left, large grotesk headline, mono URL bottom-right with a red arrow.",

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
          top: 140px;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">End / 10 of 10</div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 320px;
          font-family: var(--font-display);
          font-size: 200px;
          font-weight: 600;
          letter-spacing: -0.03em;
          opacity: 0;
        ">Read the spec<span style="color: var(--color-accent);">.</span></div>

        <div data-ref="footer" style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          bottom: 80px;
          opacity: 0;
        ">
          <div style="height: 1px; background: var(--color-fg); margin-bottom: 24px;"></div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 28px; height: 28px; border: 1.5px solid var(--color-fg); position: relative;">
                <div style="position: absolute; inset: 6px; background: var(--color-accent);"></div>
              </div>
              <span style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-fg);">Sample / 2026</span>
            </div>
            <div style="font-family: var(--font-mono); font-size: 56px; font-weight: 500; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;">
              example.run/spec <span style="color: var(--color-accent);">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const footer = host?.querySelector('[data-ref="footer"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		headline.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 60 },
		);

		footer.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 180 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
