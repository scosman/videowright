import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-kinetic",
	advances: [2.5, 5.0],
	voiceover:
		"Kinetic statements in Editorial Mono. Words enter one at a time, the last marked in red.",

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
        <div style="position: absolute; left: var(--safe-x); top: 260px; max-width: 1500px;">
          <div data-ref="label" style="
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin-bottom: 48px;
            opacity: 0;
          ">Statement</div>

          <div style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 110px;
            line-height: 1.0;
            display: flex;
            flex-wrap: wrap;
            column-gap: 38px;
            row-gap: 12px;
          ">
            <span data-ref="w0" style="opacity: 0;">Most</span>
            <span data-ref="w1" style="opacity: 0;">agents</span>
            <span data-ref="w2" style="opacity: 0;">fail</span>
            <span data-ref="w3" style="opacity: 0;">because</span>
            <span data-ref="w4" style="opacity: 0;">they</span>
            <span data-ref="w5" style="opacity: 0; position: relative;">forget.
              <span data-ref="underline" style="
                position: absolute;
                left: 0;
                bottom: 18px;
                height: 8px;
                width: 0;
                background: var(--color-accent);
              "></span>
            </span>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const underline = host?.querySelector('[data-ref="underline"]') as HTMLElement;

		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 480 });

		for (let i = 0; i < 6; i++) {
			const word = host?.querySelector(`[data-ref="w${i}"]`) as HTMLElement;
			word.animate(
				[
					{ opacity: 0, transform: "translateY(28px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 480, delay: 80 * i },
			);
		}

		underline.animate([{ width: "0%" }, { width: "calc(100% - 14px)" }], {
			duration: 480,
			delay: 1000,
			fill: "forwards",
			easing: ease,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
