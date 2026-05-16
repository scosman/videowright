import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-stat",
	advances: [2.5, 5.0],
	voiceover:
		"Stat cards in Editorial Mono. A large serif number counts up, then a red underline draws beneath it.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        padding: 0 var(--safe-x);
        gap: 80px;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div>
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 48px;
            opacity: 0;
          ">Finding / 03</div>

          <div style="position: relative; display: inline-block;">
            <div data-ref="number" style="
              font-family: var(--font-display);
              font-size: 320px;
              line-height: 0.9;
            "><span data-ref="digits">0</span><span style="color: var(--color-accent);">%</span></div>

            <div data-ref="underline" style="
              position: absolute;
              left: 0;
              bottom: -16px;
              height: 6px;
              width: 0;
              background: var(--color-accent);
            "></div>
          </div>
        </div>

        <div data-ref="description" style="opacity: 0;">
          <div style="
            font-family: var(--font-body);
            font-size: 40px;
            line-height: 1.3;
            font-weight: 400;
            max-width: 640px;
          ">of agent failures occur <em style="font-family: var(--font-display); font-style: italic;">after</em> the fourth tool call.</div>

          <div style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-top: 32px;
          ">Source / Internal Logs, Q1 2026</div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const digits = host?.querySelector('[data-ref="digits"]') as HTMLElement;
		const description = host?.querySelector('[data-ref="description"]') as HTMLElement;
		const underline = host?.querySelector('[data-ref="underline"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		// Count up from 0 to 84 over --duration-slow (900ms) using stepped holds.
		// This is the documented exception to "avoid hold-driven mutation loops":
		// counter/ticker animations are discrete text changes that cannot use WAAPI,
		// so a ctx.hold loop with DOM text updates is the correct pattern here.
		// See architecture.md §4.6 and authoring_segment.md render-safety checklist.
		const target = 84;
		const steps = 30;
		const stepDuration = 900 / steps;
		await ctx.hold(200);
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			// easeOutQuart curve for the count-up
			const eased = 1 - (1 - progress) ** 4;
			digits.textContent = String(Math.round(eased * target));
			await ctx.hold(stepDuration);
		}
		digits.textContent = String(target);

		description.animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480 },
		);

		underline.animate([{ width: "0%" }, { width: "80%" }], {
			duration: 900,
			delay: 200,
			fill: "forwards",
			easing: ease,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
