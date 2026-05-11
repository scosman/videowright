import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-stat",
	advances: [2.5, 5.0],
	voiceover:
		"Stat cards in Neon Terminal. A big number counts up digit by digit with a phosphor glow, caption below in muted.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-mono);
        overflow: hidden;
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(74, 222, 128, 0.04) 3px 4px);
        "></div>

        <div style="
          position: absolute;
          inset: var(--safe-y) var(--safe-x);
          border: 1px solid var(--color-border);
          background: rgba(10,14,11,0.6);
        ">
          <div style="
            display: flex; align-items: center;
            padding: 14px 20px;
            border-bottom: 1px solid var(--color-border);
            gap: 12px; font-size: 14px; color: var(--color-muted);
          ">
            <span style="width: 10px; height: 10px; border-radius: 5px; background: var(--color-border);"></span>
            <span style="width: 10px; height: 10px; border-radius: 5px; background: var(--color-border);"></span>
            <span style="width: 10px; height: 10px; border-radius: 5px; background: var(--color-border);"></span>
            <span style="margin-left: 16px;">beacon@console:~$ metrics --id=03</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ Q1 2026 ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ metrics.failure_rate(step > 4)
            </div>

            <div data-ref="number" style="
              font-size: 320px; font-weight: 500; line-height: 0.95;
              margin-top: 48px;
              color: var(--color-accent); text-shadow: var(--glow);
              opacity: 0;
            "><span data-ref="digits">0</span>%</div>

            <div data-ref="caption" style="font-size: 26px; margin-top: 28px; max-width: 1300px; opacity: 0;">
              <span style="color: var(--color-muted);">// </span>of agent failures occur after the 4<span style="color: var(--color-muted);">th</span> tool call.
            </div>

            <div data-ref="source" style="font-size: 18px; color: var(--color-muted); margin-top: 16px; opacity: 0;">
              source: beacon.logs · n=12,840 sessions
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const prompt = host?.querySelector('[data-ref="prompt"]') as HTMLElement;
		const number = host?.querySelector('[data-ref="number"]') as HTMLElement;
		const digits = host?.querySelector('[data-ref="digits"]') as HTMLElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;
		const source = host?.querySelector('[data-ref="source"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		prompt.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		number.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 300,
		});

		// Count up from 0 to 84 using discrete ctx.hold steps.
		// Counter/ticker animations are discrete text changes that cannot use WAAPI.
		const target = 84;
		const steps = 20;
		const stepDuration = 600 / steps;
		await ctx.hold(350);
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			const eased = 1 - (1 - progress) ** 3;
			digits.textContent = String(Math.round(eased * target));
			await ctx.hold(stepDuration);
		}
		digits.textContent = String(target);

		caption.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
		});

		source.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 160,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
