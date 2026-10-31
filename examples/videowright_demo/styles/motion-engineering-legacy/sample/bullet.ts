import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

function cornerTicks() {
	return `
    <div style="position: absolute; left: -1px; top: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; left: 0; top: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: 0; top: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; right: -1px; top: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; right: 0; top: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: 0; top: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; left: -1px; bottom: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; left: 0; bottom: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: 0; bottom: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; right: -1px; bottom: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; right: 0; bottom: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: 0; bottom: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>`;
}

export default defineSegment({
	id: "motion-engineering-sample-bullet",
	advances: [2.5, 5.0],
	voiceover:
		"Bullet reveals in Motion Engineering. Items appear row by row with mono prefixes, hairline separators, and cyan measurement deltas on the right.",

	mount(el) {
		host = el;

		const items = [
			{ n: "ITEM 01", text: "Context windows decay.", delta: "Δ = 12.4ms" },
			{ n: "ITEM 02", text: "Tool selection drifts.", delta: "Δ = 09.1ms" },
			{ n: "ITEM 03", text: "Plans go stale.", delta: "Δ = 22.6ms" },
			{ n: "ITEM 04", text: "Errors compound.", delta: "Δ = 31.0ms" },
			{ n: "ITEM 05", text: "Recovery requires restart.", delta: "Δ = 88.4ms" },
		];

		const rowHtml = items
			.map(
				(item, i) => `
        <div data-ref="row${i}" style="
          display: grid;
          grid-template-columns: 140px 1fr 200px;
          align-items: baseline;
          padding: 22px 0;
          border-top: 1px solid var(--color-border);
          opacity: 0;
        ">
          <span style="
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.2em;
            color: var(--color-accent);
          ">${item.n}</span>
          <span style="font-size: 40px;">${item.text}</span>
          <span style="
            font-family: var(--font-mono);
            font-size: 14px;
            text-align: right;
            color: var(--cyan);
            font-variant-numeric: tabular-nums;
          ">${item.delta}</span>
        </div>`,
			)
			.join("");

		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div data-ref="frame" style="
          position: absolute;
          inset: var(--safe-y) var(--safe-x);
          border: 1px solid var(--color-border);
          opacity: 0;
        ">
          ${cornerTicks()}

          <div data-ref="header" style="position: absolute; left: 80px; top: 100px; opacity: 0;">
            <div style="
              font-family: var(--font-mono);
              font-size: 14px;
              letter-spacing: 0.25em;
              color: var(--color-accent);
              margin-bottom: 18px;
            ">&#9698; 4.1 KNOWN FAILURE MODES (n=5)</div>
            <div style="
              font-family: var(--font-display);
              font-weight: 500;
              font-size: 84px;
              line-height: 1.0;
            ">Where agents break.</div>
          </div>

          <div style="position: absolute; left: 80px; right: 80px; top: 360px;">
            ${rowHtml}
          </div>
        </div>

        <div data-ref="coord" style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          opacity: 0;
        ">
          <span>X 1240.00</span><span>Y 360.00</span><span>T 0.00s</span>
          <span style="margin-left: auto;">UNIT: PX &middot; SCALE 1:1</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const frame = host?.querySelector('[data-ref="frame"]') as HTMLElement;
		const header = host?.querySelector('[data-ref="header"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		frame.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
		});

		coord.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 100,
		});

		header.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 200 },
		);

		for (let i = 0; i < 5; i++) {
			const row = host?.querySelector(`[data-ref="row${i}"]`) as HTMLElement;
			row.animate(
				[
					{ opacity: 0, transform: "translateY(10px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 300, delay: 600 + i * 180 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
