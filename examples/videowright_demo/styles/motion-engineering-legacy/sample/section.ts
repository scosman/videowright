import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

function cornerTicks() {
	return `
    <div style="position: absolute; left: -1px; top: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; left: 0; top: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: 0; top: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; right: -1px; top: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; right: 0; top: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: 0; top: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; left: -1px; bottom: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; left: 0; bottom: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: 0; bottom: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; right: -1px; bottom: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; right: 0; bottom: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: 0; bottom: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>`;
}

export default defineSegment({
	id: "motion-engineering-sample-section",
	advances: [2.0, 4.5],
	voiceover:
		"Section headers in Motion Engineering. A chapter label and title appear, then an amber line sweeps underneath.",

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
        <div data-ref="grid" style="
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>
        <div data-ref="gridPulse" style="
          position: absolute; inset: 0; pointer-events: none; opacity: 0;
          background:
            linear-gradient(rgba(232,238,245,0.15) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, rgba(232,238,245,0.15) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div data-ref="frame" style="
          position: absolute;
          inset: var(--safe-y) var(--safe-x);
          border: 1px solid var(--color-border);
          opacity: 0;
        ">
          ${cornerTicks()}

          <div data-ref="chapter" style="
            position: absolute; left: 80px; top: 180px;
            font-family: var(--font-mono);
            font-size: 16px;
            letter-spacing: 0.3em;
            color: var(--color-accent);
            opacity: 0;
          ">&mdash;&mdash; CHAPTER 02 &mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;</div>

          <div data-ref="heading" style="
            position: absolute; left: 80px; top: 260px;
            font-family: var(--font-display);
            font-weight: 500;
            font-size: 180px;
            line-height: 0.98;
            letter-spacing: -0.02em;
            opacity: 0;
          ">The architecture.</div>

          <div data-ref="sub" style="
            position: absolute; left: 80px; top: 560px;
            font-family: var(--font-mono);
            font-size: 18px;
            letter-spacing: 0.2em;
            color: var(--color-muted);
            opacity: 0;
          ">3 PRIMITIVES &middot; MEMORY &middot; REASONING &middot; RECOVERY</div>

          <svg data-ref="line" style="position: absolute; left: 80px; top: 660px; overflow: visible;" width="1500" height="12">
            <line x1="0" y1="6" x2="1500" y2="6" stroke="var(--color-accent)" stroke-width="2" style="transform-origin: 0 6px; transform: scaleX(0);" />
          </svg>
        </div>

        <div data-ref="counter" style="
          position: absolute; right: var(--safe-x); top: 28px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          opacity: 0;
        ">SCENE 02/10</div>

        <div data-ref="coord" style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          opacity: 0;
        ">
          <span>X 1240.00</span><span>Y 360.00</span><span>T 0.00s</span>
          <span style="margin-left: auto;">UNIT: PX &middot; SCALE 1:1</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const frame = host?.querySelector('[data-ref="frame"]') as HTMLElement;
		const gridPulse = host?.querySelector('[data-ref="gridPulse"]') as HTMLElement;
		const chapter = host?.querySelector('[data-ref="chapter"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const sub = host?.querySelector('[data-ref="sub"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;
		const lineEl = host
			?.querySelector('[data-ref="line"]')
			?.querySelector("line") as SVGLineElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		frame.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
		});

		counter.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 100,
		});

		coord.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 100,
		});

		chapter.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 300 },
		);

		heading.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 600 },
		);

		sub.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 1000 },
		);

		lineEl.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
			delay: 1200,
		});

		// Grid intensifies briefly as the amber line sweeps
		gridPulse.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], {
			duration: 800,
			delay: 1200,
			easing: ease,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
