import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-bullet",
	advances: [2.5, 5.0],
	voiceover: "Bullet reveals in Editorial Mono. Numbered items stagger in along the left rail.",

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
        <div style="position: absolute; left: var(--safe-x); top: 200px; right: var(--safe-x);">
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 64px;
            opacity: 0;
          ">Failure Modes</div>

          <div data-ref="headline" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 80px;
            line-height: 0.98;
            margin-bottom: 80px;
            opacity: 0;
          ">Where agents break.</div>

          <div style="display: flex; flex-direction: column; gap: 32px;">
            <div data-ref="item0" style="display: flex; align-items: baseline; gap: 48px; opacity: 0;">
              <span style="font-family: var(--font-mono); font-size: 22px; letter-spacing: 0.16em; color: var(--color-accent); min-width: 64px;">01</span>
              <span style="width: 32px; height: 1px; background: var(--color-fg); align-self: center; flex-shrink: 0;"></span>
              <span style="font-family: var(--font-body); font-size: 48px; font-weight: 500;">Context windows decay.</span>
            </div>
            <div data-ref="item1" style="display: flex; align-items: baseline; gap: 48px; opacity: 0;">
              <span style="font-family: var(--font-mono); font-size: 22px; letter-spacing: 0.16em; color: var(--color-accent); min-width: 64px;">02</span>
              <span style="width: 32px; height: 1px; background: var(--color-fg); align-self: center; flex-shrink: 0;"></span>
              <span style="font-family: var(--font-body); font-size: 48px; font-weight: 500;">Tool selection drifts.</span>
            </div>
            <div data-ref="item2" style="display: flex; align-items: baseline; gap: 48px; opacity: 0;">
              <span style="font-family: var(--font-mono); font-size: 22px; letter-spacing: 0.16em; color: var(--color-accent); min-width: 64px;">03</span>
              <span style="width: 32px; height: 1px; background: var(--color-fg); align-self: center; flex-shrink: 0;"></span>
              <span style="font-family: var(--font-body); font-size: 48px; font-weight: 500;">Plans go stale.</span>
            </div>
            <div data-ref="item3" style="display: flex; align-items: baseline; gap: 48px; opacity: 0;">
              <span style="font-family: var(--font-mono); font-size: 22px; letter-spacing: 0.16em; color: var(--color-accent); min-width: 64px;">04</span>
              <span style="width: 32px; height: 1px; background: var(--color-fg); align-self: center; flex-shrink: 0;"></span>
              <span style="font-family: var(--font-body); font-size: 48px; font-weight: 500;">Errors compound.</span>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 150 },
		);

		for (let i = 0; i < 4; i++) {
			const item = host?.querySelector(`[data-ref="item${i}"]`) as HTMLElement;
			item.animate(
				[
					{ opacity: 0, transform: "translateY(18px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 480, delay: 500 + i * 120 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
