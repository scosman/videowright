import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-grid",
	advances: [2.5, 5.0],
	voiceover:
		"Card grids in Editorial Mono. Three items separated by hairline rules, staggered entry.",

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
        <div style="position: absolute; left: var(--safe-x); top: 220px; right: var(--safe-x);">
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 64px;
            opacity: 0;
          ">The Architecture</div>

          <div data-ref="headline" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 100px;
            line-height: 0.98;
            margin-bottom: 96px;
            opacity: 0;
          ">Three primitives.</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--color-border);">
            <div data-ref="card0" style="background: var(--color-bg); padding: 48px 56px 56px; min-height: 360px; opacity: 0;">
              <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.16em; color: var(--color-accent); margin-bottom: 32px;">01</div>
              <div style="font-family: var(--font-display); font-size: 64px; margin-bottom: 32px;">Memory</div>
              <div style="font-family: var(--font-body); font-size: 24px; color: var(--color-muted); line-height: 1.4; max-width: 320px;">Persistent state across long sessions.</div>
            </div>
            <div data-ref="card1" style="background: var(--color-bg); padding: 48px 56px 56px; min-height: 360px; opacity: 0;">
              <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.16em; color: var(--color-accent); margin-bottom: 32px;">02</div>
              <div style="font-family: var(--font-display); font-size: 64px; margin-bottom: 32px;">Reasoning</div>
              <div style="font-family: var(--font-body); font-size: 24px; color: var(--color-muted); line-height: 1.4; max-width: 320px;">Plans that adapt to fresh evidence.</div>
            </div>
            <div data-ref="card2" style="background: var(--color-bg); padding: 48px 56px 56px; min-height: 360px; opacity: 0;">
              <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.16em; color: var(--color-accent); margin-bottom: 32px;">03</div>
              <div style="font-family: var(--font-display); font-size: 64px; margin-bottom: 32px;">Recovery</div>
              <div style="font-family: var(--font-body); font-size: 24px; color: var(--color-muted); line-height: 1.4; max-width: 320px;">Rewind to a last-known-good moment.</div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 150 },
		);

		for (let i = 0; i < 3; i++) {
			const card = host?.querySelector(`[data-ref="card${i}"]`) as HTMLElement;
			card.animate(
				[
					{ opacity: 0, transform: "translateY(20px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 480, delay: 450 + i * 180 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
