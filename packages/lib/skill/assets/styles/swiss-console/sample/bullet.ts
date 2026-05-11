import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-bullet",
	advances: [2.0, 5.0],
	voiceover:
		"Bullet reveals in Swiss Console. Numbered rows with mono numerals, rules between, staggered slide-in from the left.",

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
        ">Findings / 5</div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 200px;
          font-family: var(--font-display);
          font-size: 88px;
          font-weight: 500;
          opacity: 0;
        ">Where agents break.</div>

        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: 380px;">
          <div style="height: 1px; background: var(--color-fg);"></div>

          <div data-ref="row0" style="display: grid; grid-template-columns: 120px 1fr 200px; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--color-border); opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.12em; color: var(--color-fg); font-variant-numeric: tabular-nums;">01</div>
            <div style="font-family: var(--font-body); font-size: 36px; font-weight: 500;">Context windows decay.</div>
            <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); text-align: right;">Decay</div>
          </div>

          <div data-ref="row1" style="display: grid; grid-template-columns: 120px 1fr 200px; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--color-border); opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.12em; color: var(--color-fg); font-variant-numeric: tabular-nums;">02</div>
            <div style="font-family: var(--font-body); font-size: 36px; font-weight: 500;">Tool selection drifts.</div>
            <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); text-align: right;">Drift</div>
          </div>

          <div data-ref="row2" style="display: grid; grid-template-columns: 120px 1fr 200px; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--color-border); opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.12em; color: var(--color-fg); font-variant-numeric: tabular-nums;">03</div>
            <div style="font-family: var(--font-body); font-size: 36px; font-weight: 500;">Plans go stale.</div>
            <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); text-align: right;">Stale</div>
          </div>

          <div data-ref="row3" style="display: grid; grid-template-columns: 120px 1fr 200px; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--color-border); opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.12em; color: var(--color-fg); font-variant-numeric: tabular-nums;">04</div>
            <div style="font-family: var(--font-body); font-size: 36px; font-weight: 500;">Errors compound silently.</div>
            <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); text-align: right;">Compound</div>
          </div>

          <div data-ref="row4" style="display: grid; grid-template-columns: 120px 1fr 200px; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1px solid var(--color-border); opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.12em; color: var(--color-fg); font-variant-numeric: tabular-nums;">05</div>
            <div style="font-family: var(--font-body); font-size: 36px; font-weight: 500;">Recovery requires restart.</div>
            <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); text-align: right;">Restart</div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;

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

		for (let i = 0; i < 5; i++) {
			const row = host?.querySelector(`[data-ref="row${i}"]`) as HTMLElement;
			row.animate(
				[
					{ opacity: 0, transform: "translateX(-24px)" },
					{ opacity: 1, transform: "translateX(0)" },
				],
				{ ...opts, duration: 360, delay: 300 + i * 60 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
