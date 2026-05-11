import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-ui-showcase",
	advances: [2.5, 5.0],
	voiceover:
		"UI showcases in Swiss Console. A product mock framed in hairline rules with red leader-line callouts in the margins.",

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
          top: 120px;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">Fig. 03 / The Console</div>

        <div data-ref="title" style="
          position: absolute;
          left: var(--safe-x);
          top: 170px;
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 500;
          opacity: 0;
        ">One view of one run.</div>

        <div data-ref="mock" style="
          position: absolute;
          left: 360px;
          top: 320px;
          width: 1200px;
          height: 660px;
          background: var(--color-bg);
          border: 1px solid var(--color-fg);
          opacity: 0;
        ">
          <div style="height: 40px; border-bottom: 1px solid var(--color-fg); display: flex; align-items: center; gap: 8px; padding: 0 16px;">
            <div style="width: 10px; height: 10px; border: 1px solid var(--color-fg);"></div>
            <div style="width: 10px; height: 10px; border: 1px solid var(--color-fg);"></div>
            <div style="width: 10px; height: 10px; border: 1px solid var(--color-fg);"></div>
            <span style="margin-left: 16px; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted);">SESSION 41ac.run</span>
            <span style="margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); font-variant-numeric: tabular-nums;">00:14:22</span>
          </div>
          <div style="display: grid; grid-template-columns: 200px 1fr 280px; height: calc(100% - 40px);">
            <div style="border-right: 1px solid var(--color-border); padding: 16px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 14px; padding: 8px 12px; color: var(--color-muted); font-family: var(--font-body);">Run</div>
              <div style="font-size: 14px; padding: 8px 12px; color: var(--color-muted); font-family: var(--font-body);">Memory</div>
              <div style="font-size: 14px; padding: 8px 12px; background: var(--color-surface); color: var(--color-fg); font-weight: 500; font-family: var(--font-body);">Plan</div>
              <div style="font-size: 14px; padding: 8px 12px; color: var(--color-muted); font-family: var(--font-body);">Tools</div>
              <div style="font-size: 14px; padding: 8px 12px; color: var(--color-muted); font-family: var(--font-body);">Trace</div>
            </div>
            <div style="padding: 24px;">
              <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted);">Plan / v3 (revised 14:22)</div>
              <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; gap: 12px; align-items: baseline; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                  <span style="font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); font-variant-numeric: tabular-nums; min-width: 28px;">01</span>
                  <span style="font-size: 16px; font-family: var(--font-body);">Read eval spec</span>
                  <span style="margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--color-accent);">done</span>
                </div>
                <div style="display: flex; gap: 12px; align-items: baseline; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                  <span style="font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); font-variant-numeric: tabular-nums; min-width: 28px;">02</span>
                  <span style="font-size: 16px; font-family: var(--font-body);">Generate candidate prompts</span>
                  <span style="margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--color-accent);">done</span>
                </div>
                <div style="display: flex; gap: 12px; align-items: baseline; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                  <span style="font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); font-variant-numeric: tabular-nums; min-width: 28px;">03</span>
                  <span style="font-size: 16px; font-family: var(--font-body);">Score against rubric</span>
                  <span style="margin-left: auto; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted);">queued</span>
                </div>
              </div>
            </div>
            <div style="border-left: 1px solid var(--color-border); padding: 16px;">
              <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted);">Memory / Snapshots</div>
              <div style="margin-top: 12px; font-family: var(--font-mono); font-size: 12px; line-height: 1.6; color: var(--color-muted);">
                <div>t=00:02 ✓ snap_001</div>
                <div>t=00:05 ✓ snap_002</div>
                <div>t=00:09 ✓ snap_003</div>
                <div style="color: var(--color-accent);">t=00:14 ● snap_004</div>
              </div>
            </div>
          </div>
        </div>

        <div data-ref="callout-a" style="
          position: absolute;
          left: var(--safe-x);
          top: 540px;
          width: 240px;
          opacity: 0;
        ">
          <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent);">A / Plan</div>
          <div style="font-family: var(--font-body); font-size: 18px; margin-top: 6px; line-height: 1.4;">Versioned. Diff-able. Replayable.</div>
          <div data-ref="line-a" style="height: 1px; width: 0; background: var(--color-accent); margin-top: 12px;"></div>
        </div>

        <div data-ref="callout-b" style="
          position: absolute;
          right: var(--safe-x);
          top: 760px;
          width: 220px;
          text-align: right;
          opacity: 0;
        ">
          <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent);">B / Memory</div>
          <div style="font-family: var(--font-body); font-size: 18px; margin-top: 6px; line-height: 1.4;">Snapshot per tool boundary.</div>
          <div data-ref="line-b" style="height: 1px; width: 0; background: var(--color-accent); margin-top: 12px; margin-left: auto;"></div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const mock = host?.querySelector('[data-ref="mock"]') as HTMLElement;
		const calloutA = host?.querySelector('[data-ref="callout-a"]') as HTMLElement;
		const calloutB = host?.querySelector('[data-ref="callout-b"]') as HTMLElement;
		const lineA = host?.querySelector('[data-ref="line-a"]') as HTMLElement;
		const lineB = host?.querySelector('[data-ref="line-b"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		title.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 60 },
		);

		mock.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 120 },
		);

		calloutA.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 800 },
		);
		lineA.animate([{ width: "0px" }, { width: "180px" }], {
			...opts,
			duration: 360,
			delay: 800,
		});

		calloutB.animate(
			[
				{ opacity: 0, transform: "translateX(24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 1000 },
		);
		lineB.animate([{ width: "0px" }, { width: "180px" }], {
			...opts,
			duration: 360,
			delay: 1000,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
