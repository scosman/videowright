import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-title",
	advances: [2.0, 4.0],
	voiceover:
		"Title cards in Swiss Console. Display headline left-aligned on the grid, micro-labels top-left and top-right.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
      ">
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: 56px; height: 1px; background: var(--color-border);"></div>
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 56px; height: 1px; background: var(--color-border);"></div>

        <div data-ref="folio" style="
          position: absolute;
          left: var(--safe-x);
          top: 32px;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">01 / Overview</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 32px;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
          font-variant-numeric: tabular-nums;
          opacity: 0;
        ">01 / 10</div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 340px;
          font-family: var(--font-display);
          font-size: 200px;
          font-weight: 600;
          line-height: 0.96;
          letter-spacing: -0.02em;
          opacity: 0;
        ">Console<span style="color: var(--color-accent);">.</span></div>

        <div data-ref="subtitle" style="
          position: absolute;
          left: var(--safe-x);
          top: 600px;
          font-family: var(--font-body);
          font-size: 28px;
          font-weight: 400;
          color: var(--color-muted);
          max-width: 780px;
          opacity: 0;
        ">A workbench for long-running agents. Memory, recovery, observability.</div>

        <div data-ref="build" style="
          position: absolute;
          right: var(--safe-x);
          bottom: 80px;
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-fg);
          font-variant-numeric: tabular-nums;
          border-top: 1px solid var(--color-fg);
          padding-top: 14px;
          opacity: 0;
        ">Build 2026.05.10</div>
      </div>
    `;
	},

	async play(ctx) {
		const folio = host?.querySelector('[data-ref="folio"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const build = host?.querySelector('[data-ref="build"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		folio.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		counter.animate(
			[
				{ opacity: 0, transform: "translateX(24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 60 },
		);

		headline.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 120 },
		);

		subtitle.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 180 },
		);

		build.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 240 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
