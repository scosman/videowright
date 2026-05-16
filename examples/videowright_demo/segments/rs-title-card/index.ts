import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const GRAIN_BG = `url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;)`;

export default defineSegment({
	id: "rs-title-card",
	advances: [4.51],
	voiceover: "Videowright turns a coding agent into a video team.",

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
          position: absolute; inset: 0; pointer-events: none; z-index: 30;
          background-image: ${GRAIN_BG};
          opacity: var(--grain-opacity); mix-blend-mode: multiply;
        "></div>

        <svg data-ref="star" style="position: absolute; left: 140px; top: 140px; opacity: 0;" width="160" height="160">
          <polygon points="80,0 100,60 160,60 110,100 130,160 80,124 30,160 50,100 0,60 60,60" fill="var(--color-accent)" />
        </svg>

        <div data-ref="kicker" style="
          position: absolute;
          left: var(--safe-x);
          top: 360px;
          font-family: var(--font-mono);
          font-size: 24px;
          letter-spacing: 0.18em;
          font-weight: 600;
          color: var(--color-fg);
          opacity: 0;
        ">&#9670; VIDEOWRIGHT &#183; v0.1</div>

        <div data-ref="title" style="
          position: absolute;
          left: var(--safe-x);
          top: 420px;
          font-family: var(--font-display);
          font-size: 280px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">Videowright.</span>
            <span style="position: relative; color: var(--color-fg);">Videowright.</span>
          </span>
        </div>

        <div data-ref="rule" style="
          position: absolute;
          left: var(--safe-x);
          top: 740px;
          height: 14px;
          background: var(--color-accent);
          width: 0;
          transform: rotate(-1deg);
          transform-origin: left center;
        "></div>

        <div data-ref="subtitle" style="
          position: absolute;
          left: var(--safe-x);
          top: 800px;
          font-family: var(--font-display);
          font-size: 80px;
          color: var(--color-fg);
          letter-spacing: -0.015em;
          line-height: 1;
          opacity: 0;
        ">build videos in <span style="color: var(--color-accent); display: inline-block; transform: rotate(-2deg);">claude code.</span></div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 02/08 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const star = host?.querySelector('[data-ref="star"]') as SVGElement;
		const kicker = host?.querySelector('[data-ref="kicker"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const rule = host?.querySelector('[data-ref="rule"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const stepEase = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: stepEase };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		star.animate(
			[
				{ opacity: 0, transform: "rotate(-12deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-12deg) scale(1)" },
			],
			{ ...opts, duration: 240, delay: 140 },
		);

		kicker.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 220,
			delay: 380,
		});

		title.animate(
			[
				{ opacity: 0, transform: "scale(0.92)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...opts, duration: 320, delay: 700 },
		);

		rule.animate(
			[
				{ width: "0px", transform: "rotate(-1deg)" },
				{ width: "1500px", transform: "rotate(-1deg)" },
			],
			{ ...opts, duration: 360, delay: 1200 },
		);

		subtitle.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 280, delay: 1700 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
