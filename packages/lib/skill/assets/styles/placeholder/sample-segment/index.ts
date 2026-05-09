import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "placeholder-sample",
	// 2 advances: first resolves waitForNext at 2s, second transitions to next segment at 5s
	advances: [2.0, 5.0],
	voiceover: "This is the placeholder style. Clean, neutral, ready to customize.",

	// This sample uses the placeholder pack's extended tokens (--color-muted, --space-*)
	// in addition to the 6 recommended tokens. Extended tokens are pack-specific and may
	// not exist in other styles. The hello_world segments stick to the 6 recommended
	// tokens for portability; this sample demonstrates the full placeholder token set.
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
        padding: var(--space-xl);
        box-sizing: border-box;
      ">
        <h1 style="
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 700;
          margin: 0;
          opacity: 0;
        " data-ref="heading">Placeholder Style</h1>
        <p style="
          font-size: 1.25rem;
          color: var(--color-muted);
          margin-top: var(--space-md);
          max-width: 600px;
          text-align: center;
          line-height: 1.6;
          opacity: 0;
        " data-ref="body">A neutral baseline with system fonts and a single accent color. Replace this with a real style pack to give your videos a distinctive look.</p>
        <div style="
          margin-top: var(--space-lg);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-accent);
          color: var(--color-bg);
          font-family: var(--font-mono);
          font-size: 0.875rem;
          border-radius: 4px;
          opacity: 0;
        " data-ref="badge">--color-accent: #2563eb</div>
      </div>
    `;
	},

	async play(ctx) {
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;
		const badge = host?.querySelector('[data-ref="badge"]') as HTMLElement;

		// Fade in heading
		heading.animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 500, fill: "forwards", easing: "ease-out" },
		);

		await ctx.hold(300);

		// Fade in body text
		body.animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 400, fill: "forwards", easing: "ease-out" },
		);

		await ctx.hold(200);

		// Fade in accent badge
		badge.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 300,
			fill: "forwards",
		});

		await ctx.waitForNext(); // Beat 1: content is shown, user advances
	},

	unmount() {
		host = null;
	},
});
