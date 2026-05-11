import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-grid",
	advances: [2.0, 4.0],
	voiceover:
		"Card grids in Risograph. Three duotone cards stamp in, each with a different shape and a display name beneath.",

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

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 120px;
          font-family: var(--font-display);
          font-size: 140px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          transform: rotate(-2deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">three primitives.</span>
            <span style="position: relative;">three primitives.</span>
          </span>
        </div>

        <div style="position: absolute; left: 140px; right: 140px; top: 400px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 48px;">
          <div data-ref="card0" style="background: var(--color-accent); padding: 36px; min-height: 560px; color: var(--color-fg); opacity: 0; transform: rotate(-2deg);">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.2em; font-weight: 700;">01 / 03</div>
            <svg width="100%" height="260" style="margin-top: 32px;">
              <circle cx="50%" cy="130" r="100" fill="var(--color-bg)" />
            </svg>
            <div style="font-family: var(--font-display); font-size: 90px; margin-top: 32px;">memory</div>
            <div style="font-size: 26px; font-weight: 600; margin-top: 4px; opacity: 0.85;">~ remembers ~</div>
          </div>

          <div data-ref="card1" style="background: var(--color-fg); padding: 36px; min-height: 560px; color: var(--color-bg); opacity: 0; transform: rotate(2deg);">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.2em; font-weight: 700;">02 / 03</div>
            <svg width="100%" height="260" style="margin-top: 32px;">
              <polygon points="200,30 380,230 20,230" fill="var(--color-accent)" />
            </svg>
            <div style="font-family: var(--font-display); font-size: 90px; margin-top: 32px;">reasoning</div>
            <div style="font-size: 26px; font-weight: 600; margin-top: 4px; opacity: 0.85;">~ revises ~</div>
          </div>

          <div data-ref="card2" style="background: var(--color-accent); padding: 36px; min-height: 560px; color: var(--color-fg); opacity: 0; transform: rotate(-2deg);">
            <div style="font-family: var(--font-mono); font-size: 16px; letter-spacing: 0.2em; font-weight: 700;">03 / 03</div>
            <svg width="100%" height="260" style="margin-top: 32px;">
              <rect x="80" y="30" width="240" height="200" fill="var(--color-bg)" transform="rotate(-4 200 130)" />
            </svg>
            <div style="font-family: var(--font-display); font-size: 90px; margin-top: 32px;">recovery</div>
            <div style="font-size: 26px; font-weight: 600; margin-top: 4px; opacity: 0.85;">~ rewinds ~</div>
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
        ">&#9733; 07/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		headline.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		const rotations = [-2, 2, -2];
		for (let i = 0; i < 3; i++) {
			const card = host?.querySelector(`[data-ref="card${i}"]`) as HTMLElement;
			card.animate(
				[
					{ opacity: 0, transform: `rotate(${rotations[i]}deg) scale(0.85)` },
					{ opacity: 1, transform: `rotate(${rotations[i]}deg) scale(1)` },
				],
				{ ...opts, duration: 300, delay: 700 + i * 180 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
