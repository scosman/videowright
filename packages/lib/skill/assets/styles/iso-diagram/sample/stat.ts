import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-stat",
	advances: [2.5, 5.0],
	voiceover:
		"Stat cards in Iso Diagram. A big handwritten number with concentric hand-drawn circles and an arrow leader to a caption.",

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
          background-image: radial-gradient(circle, rgba(42,38,32,0.10) 1px, transparent 1.6px);
          background-size: 32px 32px;
        "></div>

        <div data-ref="label" style="
          position: absolute;
          left: 140px;
          top: 160px;
          font-family: var(--font-body);
          font-size: 28px;
          letter-spacing: 0.05em;
          color: var(--color-muted);
          opacity: 0;
        ">BEACON &middot; failure data, Q1 2026</div>

        <div style="position: absolute; left: 0; right: 0; top: 280px; text-align: center;">
          <svg style="position: absolute; left: 50%; top: 0; transform: translateX(-50%); overflow: visible;" width="700" height="700">
            <path data-ref="outerCircle" d="M 350 50 a 300 300 0 1 0 0.1 0 Z" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="1900" stroke-dashoffset="1900" />
            <path data-ref="innerCircle" d="M 350 110 a 240 240 0 1 0 0.1 0 Z" stroke="var(--color-muted)" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-dasharray="1520" stroke-dashoffset="1520" />
          </svg>

          <div data-ref="stat" style="
            position: relative;
            z-index: 1;
            padding-top: 180px;
            font-family: var(--font-display);
            font-size: 340px;
            line-height: 0.9;
            color: var(--color-accent);
          "><span data-ref="digits">0</span>%</div>
        </div>

        <svg style="position: absolute; left: 50%; bottom: 260px; transform: translateX(-50%); overflow: visible;" width="200" height="120">
          <path data-ref="leaderArrow" d="M 100 0 Q 130 50 100 100" stroke="var(--color-accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="140" stroke-dashoffset="140" />
          <polygon data-ref="arrowHead" points="100,100 93,86 107,86" fill="var(--color-accent)" opacity="0" />
        </svg>

        <div data-ref="caption" style="
          position: absolute;
          left: 0;
          right: 0;
          bottom: 180px;
          text-align: center;
          opacity: 0;
        ">
          <div style="font-family: var(--font-body); font-size: 36px; font-weight: 600; max-width: 1200px; margin: 0 auto;">
            of agent failures happen <span style="color: var(--color-accent);">after</span> the 4th tool call.
          </div>
          <div style="font-family: var(--font-mono); font-size: 18px; color: var(--color-muted); margin-top: 14px;">n=12,840 sessions</div>
        </div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 5 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const outerCircle = host?.querySelector('[data-ref="outerCircle"]') as SVGPathElement;
		const innerCircle = host?.querySelector('[data-ref="innerCircle"]') as SVGPathElement;
		const digits = host?.querySelector('[data-ref="digits"]') as HTMLElement;
		const leaderArrow = host?.querySelector('[data-ref="leaderArrow"]') as SVGPathElement;
		const arrowHead = host?.querySelector('[data-ref="arrowHead"]') as SVGPolygonElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		label.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 300 },
		);

		// Concentric circles draw on
		outerCircle.animate([{ strokeDashoffset: "1900" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 1000,
			delay: 500,
		});
		innerCircle.animate([{ strokeDashoffset: "1520" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 1000,
			delay: 800,
		});

		// Count up from 0 to 84 using ctx.hold (justified ticker exception)
		const target = 84;
		const steps = 30;
		const stepDuration = 900 / steps;
		await ctx.hold(900);
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			const eased = 1 - (1 - progress) ** 3;
			digits.textContent = String(Math.round(eased * target));
			await ctx.hold(stepDuration);
		}
		digits.textContent = String(target);

		// Leader arrow draws on from circles to caption
		leaderArrow.animate([{ strokeDashoffset: "140" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 400,
			delay: 0,
		});
		arrowHead.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 300,
		});

		// Caption swings in
		caption.animate(
			[
				{ opacity: 0, transform: "rotate(-1deg) translateY(12px)" },
				{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 0 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
