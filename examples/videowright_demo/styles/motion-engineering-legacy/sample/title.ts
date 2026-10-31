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
	id: "motion-engineering-sample-title",
	advances: [2.5, 5.0],
	voiceover:
		"Title cards in Motion Engineering. A crosshair tracks to center, dimension lines bracket the title, and a coordinate label appears below.",

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

          <div data-ref="tag" style="
            position: absolute; left: 80px; top: 100px;
            font-family: var(--font-mono);
            font-size: 14px;
            letter-spacing: 0.25em;
            color: var(--color-accent);
            opacity: 0;
          ">&#9698; DOCUMENT 01 &middot; TITLE</div>

          <div data-ref="headline" style="
            position: absolute; left: 80px; top: 220px;
            font-family: var(--font-display);
            font-weight: 500;
            font-size: 200px;
            line-height: 0.98;
            letter-spacing: -0.02em;
            opacity: 0;
          ">Beacon</div>

          <div data-ref="subtitle" style="
            position: absolute; left: 80px; top: 480px;
            font-family: var(--font-display);
            font-size: 56px;
            font-weight: 400;
            color: var(--color-muted);
            opacity: 0;
          ">Memory &middot; Reasoning &middot; Recovery</div>

          <svg data-ref="dimline" style="position: absolute; left: 80px; top: 580px; overflow: visible;" width="1500" height="60">
            <line x1="0" y1="20" x2="1500" y2="20" stroke="var(--cyan)" stroke-width="1.5" style="transform-origin: 0 20px; transform: scaleX(0);" />
            <line x1="0" y1="10" x2="0" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
            <line x1="1500" y1="10" x2="1500" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
            <text x="750" y="48" fill="var(--cyan)" font-family="var(--font-mono)" font-size="14" text-anchor="middle" style="opacity: 0;">1500.00 PX</text>
          </svg>
        </div>

        <svg data-ref="crosshair" style="position: absolute; left: 50%; top: 38%; width: 60px; height: 60px; transform: translate(-50%, -50%); overflow: visible;">
          <line x1="0" y1="30" x2="60" y2="30" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 30px 30px; transform: scaleX(0);" />
          <line x1="30" y1="0" x2="30" y2="60" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 30px 30px; transform: scaleY(0);" />
          <circle cx="30" cy="30" r="6" fill="none" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 30px 30px; transform: scale(0);" />
        </svg>

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
		const tag = host?.querySelector('[data-ref="tag"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;

		const crosshairSvg = host?.querySelector('[data-ref="crosshair"]') as SVGElement;
		const chLineH = crosshairSvg?.querySelector("line:nth-child(1)") as SVGLineElement;
		const chLineV = crosshairSvg?.querySelector("line:nth-child(2)") as SVGLineElement;
		const chCircle = crosshairSvg?.querySelector("circle") as SVGCircleElement;

		const dimSvg = host?.querySelector('[data-ref="dimline"]') as SVGElement;
		const dimMain = dimSvg?.querySelector("line:nth-child(1)") as SVGLineElement;
		const dimTickL = dimSvg?.querySelector("line:nth-child(2)") as SVGLineElement;
		const dimTickR = dimSvg?.querySelector("line:nth-child(3)") as SVGLineElement;
		const dimLabel = dimSvg?.querySelector("text") as SVGTextElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		frame.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
		});

		coord.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
			delay: 100,
		});

		chLineH.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 400,
			delay: 300,
		});

		chLineV.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
			...opts,
			duration: 400,
			delay: 350,
		});

		chCircle.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
			...opts,
			duration: 300,
			delay: 500,
		});

		tag.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 500 },
		);

		headline.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 700 },
		);

		subtitle.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 1000 },
		);

		dimMain.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
			delay: 1300,
		});

		dimTickL.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1300,
		});

		dimTickR.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1700,
		});

		dimLabel.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 1900,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
