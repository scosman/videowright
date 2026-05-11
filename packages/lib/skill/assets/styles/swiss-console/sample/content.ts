import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-content",
	advances: [2.0, 5.0],
	voiceover:
		"Content cards in Swiss Console. Two-column layout with heading on the left and body paragraph on the right, divided by a vertical rule.",

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
        ">On the Record / 09</div>

        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: 240px; display: grid; grid-template-columns: 500px 1px 1fr; gap: var(--space-lg);">
          <div data-ref="heading" style="
            font-family: var(--font-display);
            font-size: 88px;
            font-weight: 500;
            line-height: 1.0;
            opacity: 0;
          ">What we believe<span style="color: var(--color-accent);">.</span></div>

          <div style="background: var(--color-border);"></div>

          <div>
            <div data-ref="body-main" style="
              font-family: var(--font-body);
              font-size: 28px;
              line-height: 1.5;
              margin-bottom: 36px;
              opacity: 0;
            ">The next decade of AI infrastructure will be built around <span style="font-weight: 600;">long</span> runs — agents that work for hours, not seconds. The bottleneck will not be the model. It will be everything around the model.</div>

            <div data-ref="body-secondary" style="
              font-family: var(--font-body);
              font-size: 22px;
              line-height: 1.55;
              color: var(--color-muted);
              max-width: 720px;
              opacity: 0;
            ">A workbench for that world: memory, recovery, observability. Built for research engineers, founders shipping product, evaluators who need to know what their model just did and why.</div>

            <div data-ref="attribution" style="margin-top: 48px; opacity: 0;">
              <div style="height: 1px; background: var(--color-fg); margin-bottom: 16px; width: 400px;"></div>
              <div style="
                font-family: var(--font-mono);
                font-size: 13px;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--color-muted);
              ">— Engineering team / May 2026</div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const bodyMain = host?.querySelector('[data-ref="body-main"]') as HTMLElement;
		const bodySecondary = host?.querySelector('[data-ref="body-secondary"]') as HTMLElement;
		const attribution = host?.querySelector('[data-ref="attribution"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		heading.animate(
			[
				{ opacity: 0, transform: "translateX(-32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 60 },
		);

		bodyMain.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 180 },
		);

		bodySecondary.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 300 },
		);

		attribution.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 420 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
