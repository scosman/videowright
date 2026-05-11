import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-title",
	advances: [2.5, 5.0],
	voiceover:
		"Title cards in Iso Diagram. A handwritten title on paper, a wavy underline that draws itself, and a small isometric cube in the corner.",

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

        <svg data-ref="cube" style="position: absolute; left: var(--safe-x); top: 100px; overflow: visible; opacity: 0;" width="180" height="180">
          <path data-ref="cubeTop" d="M0,60 L60,0 L120,60 L60,120 Z" fill="var(--fill-yellow)" opacity="0" />
          <path data-ref="cubeFrontL" d="M0,60 L60,120 L60,180 L0,120 Z" fill="var(--fill-yellow)" opacity="0" />
          <path data-ref="cubeFrontR" d="M60,120 L120,60 L120,120 L60,180 Z" fill="var(--fill-yellow)" opacity="0" />
          <path data-ref="cubeOutline" d="M0,60 L60,0 L120,60 L60,120 Z M0,60 L60,120 L60,180 L0,120 Z M60,120 L120,60 L120,120 L60,180" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="800" stroke-dashoffset="800" />
        </svg>

        <div data-ref="label" style="
          position: absolute;
          left: var(--safe-x);
          top: 320px;
          font-family: var(--font-mono);
          font-size: 22px;
          letter-spacing: 0.1em;
          color: var(--color-muted);
          opacity: 0;
        ">BEACON &middot; v0.4</div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 380px;
          font-family: var(--font-display);
          font-size: 280px;
          color: var(--color-accent);
          line-height: 1.0;
          opacity: 0;
        ">Beacon.</div>

        <div data-ref="subtitle" style="
          position: absolute;
          left: var(--safe-x);
          top: 720px;
          font-family: var(--font-body);
          font-size: 44px;
          font-weight: 600;
          opacity: 0;
        ">Long-running agents,</div>

        <div data-ref="subtitleMuted" style="
          position: absolute;
          left: var(--safe-x);
          top: 780px;
          font-family: var(--font-body);
          font-size: 44px;
          font-weight: 400;
          color: var(--color-muted);
          opacity: 0;
        ">that don't forget where they were.</div>

        <svg data-ref="underlineSvg" style="position: absolute; left: var(--safe-x); top: 855px;" width="580" height="14">
          <path data-ref="underline" d="M 0 6 q 96 -8 192 0 t 192 0 t 192 0" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="700" stroke-dashoffset="700" />
        </svg>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 1 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const cube = host?.querySelector('[data-ref="cube"]') as SVGElement;
		const cubeOutline = host?.querySelector('[data-ref="cubeOutline"]') as SVGPathElement;
		const cubeTop = host?.querySelector('[data-ref="cubeTop"]') as SVGPathElement;
		const cubeFrontL = host?.querySelector('[data-ref="cubeFrontL"]') as SVGPathElement;
		const cubeFrontR = host?.querySelector('[data-ref="cubeFrontR"]') as SVGPathElement;
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const subtitleMuted = host?.querySelector('[data-ref="subtitleMuted"]') as HTMLElement;
		const underline = host?.querySelector('[data-ref="underline"]') as SVGPathElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		// Cube outline draws on
		cube.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });
		cubeOutline.animate([{ strokeDashoffset: "800" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 600,
			delay: 200,
		});
		// Fills flood in after outline
		cubeTop.animate([{ opacity: 0 }, { opacity: 0.95 }], { ...opts, duration: 400, delay: 700 });
		cubeFrontL.animate([{ opacity: 0 }, { opacity: 0.7 }], { ...opts, duration: 400, delay: 750 });
		cubeFrontR.animate([{ opacity: 0 }, { opacity: 0.55 }], { ...opts, duration: 400, delay: 750 });

		// Label swings in
		label.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) translateY(12px)" },
				{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 800 },
		);

		// Headline fades in
		headline.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 1100 },
		);

		// Subtitles
		subtitle.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 1700 },
		);
		subtitleMuted.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 1800 },
		);

		// Underline draws on
		underline.animate([{ strokeDashoffset: "700" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 2000,
		});

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300, delay: 300 });

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
