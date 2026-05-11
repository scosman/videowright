import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-feature",
	advances: [2.0, 5.0],
	voiceover: "Feature cards in Editorial Mono. One feature per scene with generous negative space.",

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
        <div style="position: absolute; left: var(--safe-x); top: 220px; right: var(--safe-x);">
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 64px;
            opacity: 0;
          ">Feature / 01 of 03</div>

          <div style="display: grid; grid-template-columns: 180px 1fr; gap: 64px; align-items: start;">
            <div data-ref="icon" style="
              width: 140px;
              height: 140px;
              border: var(--rule-weight) solid var(--color-fg);
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: var(--font-display);
              font-size: 100px;
              font-style: italic;
              opacity: 0;
            ">C</div>

            <div>
              <div data-ref="name" style="
                font-family: var(--font-display);
                font-style: italic;
                font-size: 80px;
                line-height: 0.98;
                opacity: 0;
              ">Checkpoint memory.</div>

              <div data-ref="body" style="
                font-family: var(--font-body);
                font-size: 32px;
                line-height: 1.4;
                max-width: 1100px;
                margin-top: 48px;
                font-weight: 400;
                opacity: 0;
              ">Snapshots an agent's reasoning state at each tool boundary. When a plan goes stale, the agent rewinds to the last point its model of the world was correct.</div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const icon = host?.querySelector('[data-ref="icon"]') as HTMLElement;
		const name = host?.querySelector('[data-ref="name"]') as HTMLElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		icon.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 150 },
		);

		name.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 250 },
		);

		body.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 500 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
