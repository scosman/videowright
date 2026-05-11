import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-kinetic",
	advances: [2.0, 4.0],
	voiceover:
		"Kinetic statements in Risograph. Words stamp in one by one, the last word in pink at larger size with misregistration.",

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

        <div style="
          position: absolute;
          left: var(--safe-x);
          top: 220px;
          right: var(--safe-x);
        ">
          <div style="
            font-family: var(--font-display);
            font-size: 200px;
            line-height: 0.95;
            letter-spacing: -0.025em;
            display: flex;
            flex-wrap: wrap;
            column-gap: 30px;
            row-gap: 10px;
          ">
            <span data-ref="w0" style="opacity: 0; display: inline-block; transform: rotate(-2deg);">
              <span style="position: relative; display: inline-block;">
                <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">most</span>
                <span style="position: relative;">most</span>
              </span>
            </span>
            <span data-ref="w1" style="opacity: 0; display: inline-block; transform: rotate(1deg);">
              <span style="position: relative; display: inline-block;">
                <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">agents</span>
                <span style="position: relative;">agents</span>
              </span>
            </span>
            <span data-ref="w2" style="opacity: 0; display: inline-block; transform: rotate(-3deg);">
              <span style="position: relative; display: inline-block;">
                <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">fail</span>
                <span style="position: relative;">fail</span>
              </span>
            </span>
            <span data-ref="w3" style="opacity: 0; display: inline-block; transform: rotate(1deg);">
              <span style="position: relative; display: inline-block;">
                <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">because</span>
                <span style="position: relative;">because</span>
              </span>
            </span>
            <span data-ref="w4" style="opacity: 0; display: inline-block; transform: rotate(-1deg);">
              <span style="position: relative; display: inline-block;">
                <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">they</span>
                <span style="position: relative;">they</span>
              </span>
            </span>
            <!-- Last word: pink-dominant variant — blue ghost / pink top (inverted from standard misreg) to emphasize the accent word -->
            <span data-ref="w5" style="opacity: 0; display: inline-block; transform: rotate(2deg); font-size: 320px; color: var(--color-accent);">
              <span style="position: relative; display: inline-block;">
                <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-fg); pointer-events: none;" aria-hidden="true">forget.</span>
                <span style="position: relative; color: var(--color-accent);">forget.</span>
              </span>
            </span>
          </div>
        </div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 03/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		const rotations = [-2, 1, -3, 1, -1, 2];
		for (let i = 0; i < 6; i++) {
			const word = host?.querySelector(`[data-ref="w${i}"]`) as HTMLElement;
			const rot = rotations[i];
			word.animate(
				[
					{ opacity: 0, transform: `rotate(${rot}deg) scale(0.85)` },
					{ opacity: 1, transform: `rotate(${rot}deg) scale(1)` },
				],
				{ ...opts, duration: 280, delay: 300 + i * 200 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
