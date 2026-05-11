import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-ui-showcase",
	advances: [2.5, 5.0],
	voiceover:
		"UI showcases in Editorial Mono. A product mock framed in hairline rules with red callout arrows.",

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
        <div data-ref="label" style="
          position: absolute;
          left: var(--safe-x);
          top: 110px;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">Plate II / The Console</div>

        <div data-ref="mock" style="
          position: absolute;
          left: 360px;
          top: 200px;
          width: 1200px;
          height: 680px;
          background: var(--color-surface);
          border: var(--rule-weight) solid var(--color-fg);
          opacity: 0;
        ">
          <div style="
            height: 48px;
            border-bottom: var(--rule-weight) solid var(--color-fg);
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 10px;
          ">
            <span style="width: 10px; height: 10px; border-radius: 5px; border: 1px solid var(--color-fg);"></span>
            <span style="width: 10px; height: 10px; border-radius: 5px; border: 1px solid var(--color-fg);"></span>
            <span style="width: 10px; height: 10px; border-radius: 5px; border: 1px solid var(--color-fg);"></span>
            <span style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-muted); margin-left: 16px;">SESSION 41ac</span>
          </div>
          <div style="padding: 32px; display: grid; grid-template-columns: 240px 1fr; gap: 32px; height: calc(100% - 48px); box-sizing: border-box;">
            <div style="border-right: var(--rule-weight) solid var(--color-border); padding-right: 24px; display: flex; flex-direction: column; gap: 14px;">
              <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted);">Run</div>
              <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted);">Memory</div>
              <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-fg); font-weight: 500;">Plan</div>
              <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted);">Tools</div>
              <div style="font-family: var(--font-body); font-size: 18px; color: var(--color-muted);">Trace</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 18px;">
              <div style="font-family: var(--font-display); font-size: 36px;">Plan / v3</div>
              <div style="display: flex; gap: 16px; align-items: baseline;">
                <span style="font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); min-width: 32px;">01</span>
                <span style="font-family: var(--font-body); font-size: 20px;">Read the eval spec</span>
              </div>
              <div style="display: flex; gap: 16px; align-items: baseline;">
                <span style="font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); min-width: 32px;">02</span>
                <span style="font-family: var(--font-body); font-size: 20px;">Generate candidate prompts</span>
              </div>
              <div style="display: flex; gap: 16px; align-items: baseline;">
                <span style="font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); min-width: 32px;">03</span>
                <span style="font-family: var(--font-body); font-size: 20px;">Score against the rubric</span>
              </div>
            </div>
          </div>
        </div>

        <div data-ref="callout-a" style="
          position: absolute;
          left: 80px;
          top: 360px;
          width: 280px;
          opacity: 0;
        ">
          <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-accent);">A / Sidebar</div>
          <div style="font-family: var(--font-body); font-size: 20px; margin-top: 8px; line-height: 1.35;">Five views of the same run.</div>
          <div data-ref="arrow-a" style="height: 1px; width: 0; background: var(--color-accent); margin-top: 14px;"></div>
        </div>

        <div data-ref="callout-b" style="
          position: absolute;
          right: var(--safe-x);
          top: 540px;
          width: 260px;
          text-align: right;
          opacity: 0;
        ">
          <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-accent);">B / Plan</div>
          <div style="font-family: var(--font-body); font-size: 20px; margin-top: 8px; line-height: 1.35;">Versioned, diff-able, replayable.</div>
          <div data-ref="arrow-b" style="height: 1px; width: 0; background: var(--color-accent); margin-top: 14px; margin-left: auto;"></div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const mock = host?.querySelector('[data-ref="mock"]') as HTMLElement;
		const calloutA = host?.querySelector('[data-ref="callout-a"]') as HTMLElement;
		const calloutB = host?.querySelector('[data-ref="callout-b"]') as HTMLElement;
		const arrowA = host?.querySelector('[data-ref="arrow-a"]') as HTMLElement;
		const arrowB = host?.querySelector('[data-ref="arrow-b"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		mock.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 200 },
		);

		calloutA.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 480,
			delay: 1000,
		});
		arrowA.animate([{ width: "0px" }, { width: "200px" }], {
			...opts,
			duration: 480,
			delay: 1000,
		});

		calloutB.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 480,
			delay: 1400,
		});
		arrowB.animate([{ width: "0px" }, { width: "200px" }], {
			...opts,
			duration: 480,
			delay: 1400,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
