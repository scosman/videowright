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
	id: "motion-engineering-sample-cta",
	advances: [2.0, 4.5],
	voiceover:
		"CTA cards in Motion Engineering. A target reticle centers on the call to action, corner ticks frame the scene, and a coordinate readout shows the URL.",

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
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div data-ref="frame" style="
          position: absolute;
          inset: var(--safe-y) var(--safe-x);
          border: 1px solid var(--color-border);
          opacity: 0;
        ">
          ${cornerTicks()}

          <svg data-ref="reticle" style="
            position: absolute; left: 50%; top: 46%;
            width: 600px; height: 600px;
            transform: translate(-50%, -50%);
            overflow: visible;
          ">
            <circle data-ref="outerRing" cx="300" cy="300" r="220" fill="none" stroke="var(--color-accent)" stroke-width="1.5" style="opacity: 0;" />
            <circle data-ref="innerRing" cx="300" cy="300" r="160" fill="none" stroke="var(--color-muted)" stroke-width="1" stroke-dasharray="3 4" style="opacity: 0;" />
            <line data-ref="rTop" x1="300" y1="20" x2="300" y2="120" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 300px 70px; transform: scaleY(0);" />
            <line data-ref="rBot" x1="300" y1="580" x2="300" y2="480" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 300px 530px; transform: scaleY(0);" />
            <line data-ref="rLeft" x1="20" y1="300" x2="120" y2="300" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 70px 300px; transform: scaleX(0);" />
            <line data-ref="rRight" x1="580" y1="300" x2="480" y2="300" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 530px 300px; transform: scaleX(0);" />
          </svg>

          <div data-ref="headline" style="
            position: absolute; left: 0; right: 0; top: 42%;
            text-align: center;
            font-family: var(--font-display);
            font-weight: 500;
            font-size: 160px;
            line-height: 1.0;
            opacity: 0;
          ">Start the agent.</div>

          <div data-ref="url" style="
            position: absolute; left: 0; right: 0; top: 64%;
            text-align: center;
            font-family: var(--font-mono);
            font-size: 28px;
            letter-spacing: 0.15em;
            color: var(--color-accent);
            opacity: 0;
          ">BEACON.RUN/START</div>

          <div data-ref="footer" style="
            position: absolute; left: 0; right: 0; bottom: 60px;
            text-align: center;
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.3em;
            color: var(--color-muted);
            opacity: 0;
          ">&mdash;&mdash;&mdash;&mdash;&mdash;&mdash;  BEACON &middot; MAY 2026 &middot; v0.4.0  &mdash;&mdash;&mdash;&mdash;&mdash;&mdash;</div>
        </div>

        <div data-ref="coord" style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          opacity: 0;
        ">
          <span>X BEACON.RUN/START</span><span>Y 360.00</span><span>T 0.00s</span>
          <span style="margin-left: auto;">UNIT: PX &middot; SCALE 1:1</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const frame = host?.querySelector('[data-ref="frame"]') as HTMLElement;
		const outerRing = host?.querySelector('[data-ref="outerRing"]') as SVGCircleElement;
		const innerRing = host?.querySelector('[data-ref="innerRing"]') as SVGCircleElement;
		const rTop = host?.querySelector('[data-ref="rTop"]') as SVGLineElement;
		const rBot = host?.querySelector('[data-ref="rBot"]') as SVGLineElement;
		const rLeft = host?.querySelector('[data-ref="rLeft"]') as SVGLineElement;
		const rRight = host?.querySelector('[data-ref="rRight"]') as SVGLineElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const url = host?.querySelector('[data-ref="url"]') as HTMLElement;
		const footer = host?.querySelector('[data-ref="footer"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		frame.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
		});

		coord.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 100,
		});

		outerRing.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 400,
			delay: 300,
		});

		innerRing.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 400,
			delay: 350,
		});

		rTop.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
			...opts,
			duration: 400,
			delay: 600,
		});

		rBot.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
			...opts,
			duration: 400,
			delay: 650,
		});

		rLeft.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 400,
			delay: 600,
		});

		rRight.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 400,
			delay: 650,
		});

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 900 },
		);

		url.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 1200 },
		);

		footer.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
			delay: 1500,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
