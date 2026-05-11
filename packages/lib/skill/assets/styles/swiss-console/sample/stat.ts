import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "swiss-console-sample-stat",
	advances: [2.5, 5.0],
	voiceover:
		"Stat cards in Swiss Console. A large tabular number counts up on the left, label and description on the right.",

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
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 56px; height: 1px; background: var(--color-border);"></div>

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
        ">Finding 03 / Q1 2026</div>

        <div style="position: absolute; left: var(--safe-x); top: 240px; border-top: 1px solid var(--color-fg); padding-top: 24px;">
          <div data-ref="number" style="
            font-family: var(--font-display);
            font-size: 420px;
            font-weight: 500;
            line-height: 0.9;
            font-variant-numeric: tabular-nums;
            font-feature-settings: 'tnum';
          "><span data-ref="digits">0</span><span style="color: var(--color-accent);">%</span></div>
        </div>

        <div data-ref="detail" style="
          position: absolute;
          left: 1100px;
          top: 280px;
          width: 640px;
          opacity: 0;
        ">
          <div style="height: 1px; background: var(--color-fg); margin-bottom: 20px;"></div>
          <div style="
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 12px;
          ">Failure-after-step-4 rate</div>
          <div style="
            font-family: var(--font-body);
            font-size: 28px;
            line-height: 1.4;
          ">of agent failures occur after the fourth tool call, when context, plan, and toolset have all drifted.</div>
        </div>

        <div data-ref="sparkline" style="
          position: absolute;
          left: 1100px;
          top: 620px;
          width: 640px;
          opacity: 0;
        ">
          <div style="
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 12px;
          ">Q1 '25 &rarr; Q1 '26</div>
          <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
            <polyline points="0,60 50,55 100,52 150,48 200,40 250,32 300,25 350,18 400,12" stroke="var(--color-fg)" stroke-width="1.5" fill="none" />
            <circle cx="400" cy="12" r="4" fill="var(--color-accent)" />
          </svg>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const digits = host?.querySelector('[data-ref="digits"]') as HTMLElement;
		const detail = host?.querySelector('[data-ref="detail"]') as HTMLElement;
		const sparkline = host?.querySelector('[data-ref="sparkline"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		// Count up from 0 to 84 over 720ms using stepped holds.
		// Counter/ticker animations are discrete text changes that cannot use WAAPI,
		// so a ctx.hold loop with DOM text updates is the correct pattern.
		const target = 84;
		const steps = 30;
		const stepDuration = 720 / steps;
		await ctx.hold(150);
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			const eased = 1 - (1 - progress) ** 4;
			digits.textContent = String(Math.round(eased * target));
			await ctx.hold(stepDuration);
		}
		digits.textContent = String(target);

		detail.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360 },
		);

		sparkline.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 180 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
