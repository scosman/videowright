import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "hello-outro",
	advances: [3.0],
	voiceover: "Tell the agent what to change next. Swap the style, add content, and make it yours.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
      ">
        <h1 style="
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 700;
          margin: 0;
          opacity: 0;
        " data-ref="heading">Start Building</h1>
        <p style="
          font-size: 1.25rem;
          color: var(--color-fg);
          margin-top: 1.5rem;
          max-width: 600px;
          text-align: center;
          line-height: 1.6;
          opacity: 0;
        " data-ref="cta">Tell the agent what to change next. Swap the style, add content, and make it yours.
        </p>
      </div>
    `;
	},

	async play(ctx) {
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const cta = host?.querySelector('[data-ref="cta"]') as HTMLElement;

		// Animate heading in
		heading.animate(
			[
				{ opacity: 0, transform: "scale(0.9)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ duration: 500, fill: "forwards", easing: "ease-out" },
		);

		await ctx.hold(500);

		// Animate call-to-action in
		cta.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 400,
			fill: "forwards",
		});

		// No waitForNext -- last segment. play() resolves after the animation.
		// The player shows "end of timeline" in the HUD.
	},

	unmount() {
		host = null;
	},
});
