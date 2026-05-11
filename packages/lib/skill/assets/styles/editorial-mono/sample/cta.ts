import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "editorial-mono-sample-cta",
	advances: [2.0, 5.0],
	voiceover:
		"CTA cards in Editorial Mono. A centered italic headline with a red arrow pointing to the destination.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 56px;
        overflow: hidden;
      ">
        <div data-ref="label" style="
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-muted);
          opacity: 0;
        ">Continued in Vol. 02</div>

        <div data-ref="headline" style="
          font-family: var(--font-display);
          font-style: italic;
          font-size: 100px;
          line-height: 0.98;
          text-align: center;
          opacity: 0;
        ">Read the brief.</div>

        <div data-ref="cta" style="
          display: flex;
          align-items: center;
          gap: 24px;
          opacity: 0;
        ">
          <span style="font-family: var(--font-body); font-size: 36px; font-weight: 500;">example.com</span>
          <span style="font-family: var(--font-display); font-style: italic; font-size: 60px; line-height: 1; color: var(--color-accent);">&rarr;</span>
        </div>

        <div data-ref="logo" style="
          position: absolute;
          bottom: var(--safe-y);
          display: flex;
          align-items: center;
          gap: 14px;
          opacity: 0;
        ">
          <div style="
            width: 24px;
            height: 24px;
            border: 1.5px solid var(--color-fg);
            position: relative;
          "><div style="position: absolute; inset: 6px; background: var(--color-accent);"></div></div>
          <span style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase;">Sample / 2026</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const cta = host?.querySelector('[data-ref="cta"]') as HTMLElement;
		const logo = host?.querySelector('[data-ref="logo"]') as HTMLElement;

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

		cta.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 480, delay: 400 },
		);

		logo.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 480,
			delay: 650,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
