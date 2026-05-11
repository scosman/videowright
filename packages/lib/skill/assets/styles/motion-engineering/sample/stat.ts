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
	id: "motion-engineering-sample-stat",
	advances: [2.5, 5.0],
	voiceover:
		"Stat cards in Motion Engineering. A big number ticks up while cyan dimension lines draw above and below, bracketing its size.",

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

          <div data-ref="label" style="
            position: absolute; left: 80px; top: 100px;
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.25em;
            color: var(--color-accent);
            opacity: 0;
          ">&#9698; FIG. 05.1 &middot; FAILURE_RATE(step &gt; 4)</div>

          <div style="position: absolute; left: 80px; top: 200px; width: 1100px;">
            <svg data-ref="dimtop" style="width: 100%; height: 36px; overflow: visible; display: block;">
              <line x1="0" y1="18" x2="1100" y2="18" stroke="var(--cyan)" stroke-width="1.5" style="transform-origin: 0 18px; transform: scaleX(0);" />
              <line x1="0" y1="6" x2="0" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
              <line x1="1100" y1="6" x2="1100" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
            </svg>

            <div data-ref="number" style="
              font-family: var(--font-display);
              font-weight: 500;
              font-size: 360px;
              line-height: 1.0;
              margin: 20px 0;
              color: var(--color-accent);
              font-variant-numeric: tabular-nums;
            "><span data-ref="digits">0</span><span style="font-size: 180px;">%</span></div>

            <svg data-ref="dimbot" style="width: 100%; height: 36px; overflow: visible; display: block;">
              <line x1="0" y1="18" x2="1100" y2="18" stroke="var(--cyan)" stroke-width="1.5" style="transform-origin: 0 18px; transform: scaleX(0);" />
              <line x1="0" y1="6" x2="0" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
              <line x1="1100" y1="6" x2="1100" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
            </svg>
          </div>

          <div data-ref="caption" style="
            position: absolute; right: 80px; top: 320px; width: 600px;
            opacity: 0;
          ">
            <div style="
              font-family: var(--font-mono);
              font-size: 12px;
              letter-spacing: 0.25em;
              color: var(--color-muted);
              margin-bottom: 18px;
            ">&mdash;&mdash; CAPTION &mdash;&mdash;</div>
            <div style="font-size: 28px; line-height: 1.35;">of agent failures occur after the 4th tool call.</div>
            <div style="
              font-family: var(--font-mono);
              font-size: 13px;
              margin-top: 24px;
              letter-spacing: 0.15em;
              color: var(--color-muted);
            ">SOURCE: BEACON.LOGS &middot; N=12,840 &middot; Q1&middot;2026</div>
          </div>
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
          <span>X 1240.00</span><span>Y 360.00</span><span>T 0.00s</span>
          <span style="margin-left: auto;">UNIT: PX &middot; SCALE 1:1</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const frame = host?.querySelector('[data-ref="frame"]') as HTMLElement;
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const digits = host?.querySelector('[data-ref="digits"]') as HTMLElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;

		const dimTopSvg = host?.querySelector('[data-ref="dimtop"]') as SVGElement;
		const dimTopLine = dimTopSvg?.querySelector("line:nth-child(1)") as SVGLineElement;
		const dimTopTickL = dimTopSvg?.querySelector("line:nth-child(2)") as SVGLineElement;
		const dimTopTickR = dimTopSvg?.querySelector("line:nth-child(3)") as SVGLineElement;

		const dimBotSvg = host?.querySelector('[data-ref="dimbot"]') as SVGElement;
		const dimBotLine = dimBotSvg?.querySelector("line:nth-child(1)") as SVGLineElement;
		const dimBotTickL = dimBotSvg?.querySelector("line:nth-child(2)") as SVGLineElement;
		const dimBotTickR = dimBotSvg?.querySelector("line:nth-child(3)") as SVGLineElement;

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

		label.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		dimTopLine.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
			delay: 400,
		});

		dimTopTickL.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 400,
		});

		dimTopTickR.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 800,
		});

		// Count up from 0 to 84 over 720ms using stepped holds.
		// Counter/ticker animations are discrete text changes that cannot use WAAPI,
		// so a ctx.hold loop with DOM text updates is the correct pattern.
		const target = 84;
		const steps = 24;
		const stepDuration = 720 / steps;
		await ctx.hold(500);
		for (let i = 1; i <= steps; i++) {
			const progress = i / steps;
			const eased = 1 - (1 - progress) ** 3;
			digits.textContent = String(Math.round(eased * target));
			await ctx.hold(stepDuration);
		}
		digits.textContent = String(target);

		dimBotLine.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
		});

		dimBotTickL.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
		});

		dimBotTickR.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 400,
		});

		caption.animate(
			[
				{ opacity: 0, transform: "translateX(32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 360, delay: 200 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
