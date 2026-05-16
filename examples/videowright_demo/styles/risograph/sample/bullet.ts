import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-bullet",
	advances: [2.0, 4.0],
	voiceover:
		"Bullet reveals in Risograph. Each row stamps in with a pink number, blue text, and an optional yellow tag chip.",

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
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">where agents break:</span>
            <span style="position: relative;">where agents break:</span>
          </span>
        </div>

        <div style="position: absolute; left: 140px; right: 140px; top: 380px; display: flex; flex-direction: column; gap: 0;">
          <div data-ref="row0" style="display: flex; align-items: baseline; gap: 32px; padding: 14px 0; opacity: 0; transform: rotate(-0.5deg);">
            <span style="font-family: var(--font-display); font-size: 96px; color: var(--color-accent); min-width: 130px;">01</span>
            <span style="font-family: var(--font-display); font-size: 76px;">context decays.</span>
          </div>
          <div data-ref="row1" style="display: flex; align-items: baseline; gap: 32px; padding: 14px 0; opacity: 0; transform: rotate(0.5deg);">
            <span style="font-family: var(--font-display); font-size: 96px; color: var(--color-accent); min-width: 130px;">02</span>
            <span style="font-family: var(--font-display); font-size: 76px;">tools drift.</span>
          </div>
          <div data-ref="row2" style="display: flex; align-items: baseline; gap: 32px; padding: 14px 0; opacity: 0; transform: rotate(-0.5deg);">
            <span style="font-family: var(--font-display); font-size: 96px; color: var(--color-accent); min-width: 130px;">03</span>
            <span style="font-family: var(--font-display); font-size: 76px;">plans go stale.</span>
            <span style="
              display: inline-block; padding: 6px 12px; margin-left: auto;
              background: var(--color-second); color: var(--color-fg);
              font-family: var(--font-body); font-weight: 700; font-size: 14px;
              letter-spacing: 0.1em; text-transform: uppercase;
              transform: rotate(-2deg);
            ">main fail</span>
          </div>
          <div data-ref="row3" style="display: flex; align-items: baseline; gap: 32px; padding: 14px 0; opacity: 0; transform: rotate(0.5deg);">
            <span style="font-family: var(--font-display); font-size: 96px; color: var(--color-accent); min-width: 130px;">04</span>
            <span style="font-family: var(--font-display); font-size: 76px;">errors compound.</span>
          </div>
          <div data-ref="row4" style="display: flex; align-items: baseline; gap: 32px; padding: 14px 0; opacity: 0; transform: rotate(-0.5deg);">
            <span style="font-family: var(--font-display); font-size: 96px; color: var(--color-accent); min-width: 130px;">05</span>
            <span style="font-family: var(--font-display); font-size: 76px;">recovery means restart.</span>
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
        ">&#9733; 04/10 &#9733;</div>
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

		for (let i = 0; i < 5; i++) {
			const row = host?.querySelector(`[data-ref="row${i}"]`) as HTMLElement;
			const rot = i % 2 === 0 ? -0.5 : 0.5;
			row.animate(
				[
					{ opacity: 0, transform: `rotate(${rot}deg) scale(0.9)` },
					{ opacity: 1, transform: `rotate(${rot}deg) scale(1)` },
				],
				{ ...opts, duration: 280, delay: 700 + i * 160 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
