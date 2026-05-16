import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-cta",
	advances: [2.0, 4.0],
	voiceover:
		"CTA cards in Risograph. A massive misregistered call-to-action stamps in with pink star accents and the URL in mono beneath.",

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

        <svg data-ref="starTL" style="position: absolute; left: var(--safe-x); top: 140px; opacity: 0;" width="180" height="180">
          <polygon points="90,0 110,70 180,70 122,112 145,180 90,140 35,180 58,112 0,70 70,70" fill="var(--color-second)" />
        </svg>

        <!-- Pink-dominant variant: blue ghost / pink top — CTA is the accent focal point -->
        <div data-ref="cta" style="
          position: absolute;
          left: 0;
          right: 0;
          top: 320px;
          text-align: center;
          font-family: var(--font-display);
          font-size: 320px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          transform: rotate(-2deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-fg); pointer-events: none;" aria-hidden="true">start it.</span>
            <span style="position: relative; color: var(--color-accent);">start it.</span>
          </span>
        </div>

        <div data-ref="url" style="
          position: absolute;
          left: 0;
          right: 0;
          top: 680px;
          text-align: center;
          opacity: 0;
        ">
          <span style="
            display: inline-block;
            font-family: var(--font-display);
            font-size: 120px;
            background: var(--color-accent);
            color: var(--color-fg);
            padding: 12px 36px;
            transform: rotate(2deg);
          ">beacon.run</span>
        </div>

        <svg data-ref="starBR" style="position: absolute; right: 200px; bottom: 200px; opacity: 0;" width="140" height="140">
          <polygon points="70,0 86,54 140,54 96,86 112,140 70,108 28,140 44,86 0,54 54,54" fill="var(--color-accent)" />
        </svg>

        <div data-ref="footer" style="
          position: absolute;
          left: 0;
          right: 0;
          bottom: 80px;
          text-align: center;
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.25em;
          opacity: 0;
        ">&#9733; BEACON &#183; MAY 2026 &#9733;</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 10/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const starTL = host?.querySelector('[data-ref="starTL"]') as SVGElement;
		const cta = host?.querySelector('[data-ref="cta"]') as HTMLElement;
		const url = host?.querySelector('[data-ref="url"]') as HTMLElement;
		const starBR = host?.querySelector('[data-ref="starBR"]') as SVGElement;
		const footer = host?.querySelector('[data-ref="footer"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		starTL.animate(
			[
				{ opacity: 0, transform: "rotate(-15deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-15deg) scale(1)" },
			],
			{ ...opts, duration: 280, delay: 200 },
		);

		cta.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 320, delay: 500 },
		);

		url.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 280, delay: 1100 });

		starBR.animate(
			[
				{ opacity: 0, transform: "rotate(12deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(12deg) scale(1)" },
			],
			{ ...opts, duration: 280, delay: 1500 },
		);

		footer.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 280, delay: 1800 });

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
