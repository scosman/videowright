import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-content",
	advances: [2.0, 5.0],
	voiceover:
		"Content cards in Editorial Mono. A headline and body paragraph with generous line height.",

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
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: 200px;">
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 48px;
            opacity: 0;
          ">On the Record</div>

          <div data-ref="headline" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 120px;
            line-height: 0.98;
            margin-bottom: 64px;
            opacity: 0;
          ">What we believe.</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 96px;">
            <div data-ref="col1" style="
              font-family: var(--font-body);
              font-size: 28px;
              line-height: 1.5;
              font-weight: 400;
              opacity: 0;
            ">The next decade of AI infrastructure will be built around <em style="font-family: var(--font-display); font-style: italic;">long</em> runs — agents that work for hours, not seconds. The bottleneck will be everything around the model.</div>

            <div data-ref="col2" style="
              font-family: var(--font-body);
              font-size: 22px;
              line-height: 1.55;
              color: var(--color-muted);
              opacity: 0;
            ">A workbench for long-running agents: memory, recovery, observability. Designed for research engineers at labs, founders shipping product, evaluators who need to know what their model just did and why.</div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const col1 = host?.querySelector('[data-ref="col1"]') as HTMLElement;
		const col2 = host?.querySelector('[data-ref="col2"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 200 },
		);

		col1.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 450 },
		);

		col2.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 650 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
