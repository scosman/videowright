import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-stat",
	advances: [2.0, 4.0],
	voiceover:
		"Stat cards in Risograph. A huge pink number with misregistration, caption underneath in a slim column.",

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

        <div data-ref="label" style="
          position: absolute;
          left: var(--safe-x);
          top: 120px;
          font-family: var(--font-mono);
          font-size: 22px;
          letter-spacing: 0.1em;
          font-weight: 700;
          text-transform: uppercase;
          opacity: 0;
        ">&#9733; failure data &#183; Q1 2026</div>

        <svg data-ref="blob" style="position: absolute; left: 140px; top: 240px; overflow: visible; opacity: 0;" width="1300" height="700">
          <ellipse cx="650" cy="350" rx="640" ry="310" fill="var(--color-accent)" />
        </svg>

        <div data-ref="number" style="
          position: absolute;
          left: 280px;
          top: 360px;
          font-family: var(--font-display);
          font-size: 560px;
          line-height: 0.85;
          letter-spacing: -0.025em;
          color: var(--color-bg);
          transform: rotate(-3deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-fg); pointer-events: none; opacity: 0.4;" aria-hidden="true"><span data-ref="digitGhost">0</span>%</span>
            <span style="position: relative; color: var(--color-bg);"><span data-ref="digits">0</span>%</span>
          </span>
        </div>

        <div data-ref="caption" style="
          position: absolute;
          left: 140px;
          bottom: 140px;
          width: 1300px;
          opacity: 0;
        ">
          <div style="font-size: 40px; font-weight: 600; line-height: 1.3;">
            of agent failures happen <span style="color: var(--color-accent);">after</span> the 4th tool call.
          </div>
          <div style="font-family: var(--font-mono); font-size: 16px; margin-top: 14px; letter-spacing: 0.1em;">BEACON.LOGS &#183; N=12,840</div>
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
        ">&#9733; 05/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const blob = host?.querySelector('[data-ref="blob"]') as SVGElement;
		const number = host?.querySelector('[data-ref="number"]') as HTMLElement;
		const digits = host?.querySelector('[data-ref="digits"]') as HTMLElement;
		const digitGhost = host?.querySelector('[data-ref="digitGhost"]') as HTMLElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		label.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 280, delay: 200 });

		blob.animate(
			[
				{ opacity: 0, transform: "rotate(4deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(4deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 400 },
		);

		number.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300, delay: 700 });

		// Count up from 0 to 84 in stepped increments
		const target = 84;
		const steps = 14;
		const stepDuration = 50;
		await ctx.hold(800);
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			const eased = 1 - (1 - progress) ** 3;
			const val = String(Math.round(eased * target));
			digits.textContent = val;
			digitGhost.textContent = val;
			await ctx.hold(stepDuration);
		}
		digits.textContent = String(target);
		digitGhost.textContent = String(target);

		caption.animate(
			[
				{ opacity: 0, transform: "rotate(-1deg)" },
				{ opacity: 1, transform: "rotate(-1deg)" },
			],
			{ ...opts, duration: 280 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
