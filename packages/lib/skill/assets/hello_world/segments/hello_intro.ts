import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "hello-intro",
	// 2 advances: first resolves waitForNext at 2s, second transitions to next segment at 4s
	advances: [2.0, 4.0],
	voiceover: "Welcome to Videowright. Build animated videos with HTML, CSS, and JavaScript.",

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
        font-family: var(--font-display);
      ">
        <h1 style="
          font-size: 4rem;
          font-weight: 700;
          margin: 0;
          opacity: 0;
        " data-ref="title">Hello Videowright</h1>
        <p style="
          font-family: var(--font-body);
          font-size: 1.5rem;
          color: var(--color-fg);
          margin-top: 1rem;
          opacity: 0;
        " data-ref="subtitle">Built with HTML, CSS, and JavaScript</p>
      </div>
    `;
	},

	async play(ctx) {
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;

		// Animate title in
		title.animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 600, fill: "forwards", easing: "ease-out" },
		);

		// Animate subtitle in — staggered via WAAPI delay (render-safe)
		subtitle.animate(
			[
				{ opacity: 0, transform: "translateY(10px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ duration: 400, delay: 400, fill: "forwards", easing: "ease-out" },
		);

		await ctx.waitForNext(); // Beat 1: content fully revealed, wait for user to advance
	},

	unmount() {
		host = null;
	},
});
