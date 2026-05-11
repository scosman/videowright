import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-feature",
	advances: [2.0, 5.0],
	voiceover:
		"Feature cards in Swiss Console. Three-column layout with icon, feature name, and description separated by hairline rules.",

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
        ">Feature 01 of 03</div>

        <div style="position: absolute; left: var(--safe-x); top: 220px; right: var(--safe-x); display: grid; grid-template-columns: 300px 1px 1fr; gap: var(--space-lg);">
          <div data-ref="icon-col" style="opacity: 0;">
            <div style="
              font-family: var(--font-mono);
              font-size: 18px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--color-accent);
              font-variant-numeric: tabular-nums;
              margin-bottom: 16px;
            ">F.01</div>
            <div style="
              width: 160px;
              height: 160px;
              border: 1.5px solid var(--color-fg);
              display: grid;
              place-items: center;
              font-family: var(--font-mono);
              font-size: 64px;
              font-weight: 500;
            ">C</div>
            <div style="
              font-family: var(--font-mono);
              font-size: 13px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--color-muted);
              margin-top: 20px;
            ">Module: Memory</div>
          </div>

          <div style="background: var(--color-border);"></div>

          <div>
            <div data-ref="name" style="
              font-family: var(--font-display);
              font-size: 120px;
              font-weight: 500;
              line-height: 0.96;
              margin-bottom: 32px;
              opacity: 0;
            ">Checkpoint memory<span style="color: var(--color-accent);">.</span></div>

            <div data-ref="desc" style="
              font-family: var(--font-body);
              font-size: 28px;
              line-height: 1.5;
              max-width: 920px;
              margin-bottom: 32px;
              opacity: 0;
            ">Snapshots an agent's reasoning state at each tool boundary. When a plan goes stale, the agent rewinds to the last point its model of the world was correct.</div>

            <div data-ref="stats" style="display: flex; gap: var(--space-lg); opacity: 0;">
              <div>
                <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted);">snapshots/min</div>
                <div style="font-family: var(--font-display); font-size: 48px; font-weight: 500; font-variant-numeric: tabular-nums; margin-top: 8px;">120</div>
              </div>
              <div>
                <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted);">avg restore</div>
                <div style="font-family: var(--font-display); font-size: 48px; font-weight: 500; font-variant-numeric: tabular-nums; margin-top: 8px;">9 ms</div>
              </div>
              <div>
                <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted);">retention</div>
                <div style="font-family: var(--font-display); font-size: 48px; font-weight: 500; font-variant-numeric: tabular-nums; margin-top: 8px;">14 d</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const iconCol = host?.querySelector('[data-ref="icon-col"]') as HTMLElement;
		const name = host?.querySelector('[data-ref="name"]') as HTMLElement;
		const desc = host?.querySelector('[data-ref="desc"]') as HTMLElement;
		const stats = host?.querySelector('[data-ref="stats"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		iconCol.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 60 },
		);

		name.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 120 },
		);

		desc.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 240 },
		);

		stats.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 360 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
