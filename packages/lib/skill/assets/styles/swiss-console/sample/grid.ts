import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-grid",
	advances: [2.5, 5.0],
	voiceover:
		"Card grids in Swiss Console. Four dense columns with micro-labels, feature names, and mono API references, staggered in from below.",

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
        ">Architecture / 4 Primitives</div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 200px;
          font-family: var(--font-display);
          font-size: 88px;
          font-weight: 500;
          opacity: 0;
        ">Four primitives, one runtime.</div>

        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: 420px; display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--grid-gutter);">
          <div data-ref="card0" style="border: 1px solid var(--color-border); padding: 28px 24px 32px; min-height: 380px; position: relative; opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px; font-variant-numeric: tabular-nums;">01 / 04</div>
            <div style="font-family: var(--font-display); font-size: 44px; font-weight: 600; margin-bottom: 20px;">Memory</div>
            <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); line-height: 1.45; margin-bottom: 28px;">Persistent state across long sessions.</div>
            <div style="height: 1px; background: var(--color-border); margin-bottom: 12px;"></div>
            <div style="font-family: var(--font-mono); font-size: 14px; color: var(--color-fg);">memory.snap()</div>
          </div>

          <div data-ref="card1" style="border: 1px solid var(--color-border); padding: 28px 24px 32px; min-height: 380px; position: relative; opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px; font-variant-numeric: tabular-nums;">02 / 04</div>
            <div style="font-family: var(--font-display); font-size: 44px; font-weight: 600; margin-bottom: 20px;">Reasoning</div>
            <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); line-height: 1.45; margin-bottom: 28px;">Plans that adapt to fresh evidence.</div>
            <div style="height: 1px; background: var(--color-border); margin-bottom: 12px;"></div>
            <div style="font-family: var(--font-mono); font-size: 14px; color: var(--color-fg);">plan.revise()</div>
          </div>

          <div data-ref="card2" style="border: 1px solid var(--color-border); padding: 28px 24px 32px; min-height: 380px; position: relative; opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px; font-variant-numeric: tabular-nums;">03 / 04</div>
            <div style="font-family: var(--font-display); font-size: 44px; font-weight: 600; margin-bottom: 20px;">Recovery</div>
            <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); line-height: 1.45; margin-bottom: 28px;">Rewind to a last-known-good moment.</div>
            <div style="height: 1px; background: var(--color-border); margin-bottom: 12px;"></div>
            <div style="font-family: var(--font-mono); font-size: 14px; color: var(--color-fg);">rewind.to(t)</div>
          </div>

          <div data-ref="card3" style="border: 1px solid var(--color-border); padding: 28px 24px 32px; min-height: 380px; position: relative; opacity: 0;">
            <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 24px; font-variant-numeric: tabular-nums;">04 / 04</div>
            <div style="font-family: var(--font-display); font-size: 44px; font-weight: 600; margin-bottom: 20px;">Eval</div>
            <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted); line-height: 1.45; margin-bottom: 28px;">Score runs against structured rubrics.</div>
            <div style="height: 1px; background: var(--color-border); margin-bottom: 12px;"></div>
            <div style="font-family: var(--font-mono); font-size: 14px; color: var(--color-fg);">eval.score(run)</div>
          </div>
        </div>

        <div data-ref="footer" style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          bottom: var(--safe-y);
          display: grid;
          grid-template-columns: repeat(var(--grid-cols), 1fr);
          gap: var(--grid-gutter);
          opacity: 0;
        ">
          <div style="grid-column: 1 / 5; height: 1px; background: var(--color-border); align-self: center;"></div>
          <div style="grid-column: 5 / 13; font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); font-variant-numeric: tabular-nums;">System: 04 of 12 cols active</div>
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

		for (let i = 0; i < 4; i++) {
			const card = host?.querySelector(`[data-ref="card${i}"]`) as HTMLElement;
			card.animate(
				[
					{ opacity: 0, transform: "translateY(28px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 360, delay: 240 + i * 60 },
			);
		}

		footer.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 500 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
