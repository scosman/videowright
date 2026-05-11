import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-title",
	advances: [2.0, 4.0],
	voiceover:
		"Title cards in Risograph. Huge misregistered display type stamps in on warm paper, a pink star punches the corner.",

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
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;);
          opacity: var(--grain-opacity); mix-blend-mode: multiply;
        "></div>

        <svg data-ref="star" style="position: absolute; left: var(--safe-x); top: 140px; opacity: 0;" width="160" height="160">
          <polygon points="80,0 100,60 160,60 110,100 130,160 80,124 30,160 50,100 0,60 60,60" fill="var(--color-accent)" />
        </svg>

        <div data-ref="label" style="
          position: absolute;
          left: var(--safe-x);
          top: 320px;
          font-family: var(--font-mono);
          font-size: 22px;
          letter-spacing: 0.1em;
          font-weight: 600;
          opacity: 0;
        ">BEACON &#183; LONG-RUNNING AGENTS</div>

        <div data-ref="title" style="
          position: absolute;
          left: var(--safe-x);
          top: 380px;
          font-family: var(--font-display);
          font-size: 340px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">BEACON.</span>
            <span style="position: relative; color: var(--color-fg);">BEACON.</span>
          </span>
        </div>

        <div data-ref="subtitle" style="
          position: absolute;
          left: 280px;
          top: 760px;
          font-family: var(--font-display);
          font-size: 92px;
          color: var(--color-accent);
          transform: rotate(-2deg);
          opacity: 0;
        ">agents that don't forget.</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 01/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const star = host?.querySelector('[data-ref="star"]') as SVGElement;
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		star.animate(
			[
				{ opacity: 0, transform: "rotate(-15deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-15deg) scale(1)" },
			],
			{ ...opts, duration: 280, delay: 200 },
		);

		label.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 280,
			delay: 500,
		});

		title.animate(
			[
				{ opacity: 0, transform: "scale(0.9)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...opts, duration: 320, delay: 800 },
		);

		subtitle.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 280, delay: 1400 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
