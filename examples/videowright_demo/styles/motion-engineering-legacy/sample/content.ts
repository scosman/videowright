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
	id: "motion-engineering-sample-content",
	advances: [2.5, 5.0],
	voiceover:
		"Content cards in Motion Engineering. A title with a crosshair marker, body in two columns, and an inline annotation with a leader line.",

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
            font-size: 13px;
            letter-spacing: 0.25em;
            color: var(--color-accent);
            opacity: 0;
          ">&#9698; MEMO &middot; 2026.05 &middot; BEACON.TEAM</div>

          <div data-ref="heading" style="
            position: absolute; left: 80px; top: 160px;
            font-family: var(--font-display);
            font-weight: 500;
            font-size: 84px;
            margin-bottom: 56px;
            opacity: 0;
          ">What we believe.</div>

          <svg data-ref="chMark" style="position: absolute; left: 52px; top: 180px; overflow: visible;" width="20" height="20">
            <line x1="0" y1="10" x2="20" y2="10" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 10px 10px; transform: scaleX(0);" />
            <line x1="10" y1="0" x2="10" y2="20" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 10px 10px; transform: scaleY(0);" />
          </svg>

          <div style="
            position: absolute; left: 80px; right: 80px; top: 380px;
            display: grid; grid-template-columns: 1fr 1fr; gap: 56px;
          ">
            <div data-ref="colA" style="opacity: 0;">
              <div style="font-size: 30px; line-height: 1.45; margin-bottom: 24px;">
                The next decade of AI infrastructure will be built around <span style="color: var(--color-accent);">long runs</span> &mdash; agents that work for hours, not seconds.
              </div>
              <div style="
                font-family: var(--font-mono);
                font-size: 12px;
                letter-spacing: 0.25em;
                padding-top: 16px;
                border-top: 1px solid var(--color-border);
                color: var(--color-muted);
              ">&mdash;&mdash; THESIS A &mdash;&mdash;</div>
            </div>
            <div data-ref="colB" style="opacity: 0; position: relative;">
              <div style="font-size: 26px; line-height: 1.5; color: var(--color-muted); margin-bottom: 24px;">
                The bottleneck won't be the model. It will be everything around the model &mdash; memory, recovery, observability. The unglamorous parts. The parts we are building.
              </div>
              <div style="
                font-family: var(--font-mono);
                font-size: 12px;
                letter-spacing: 0.25em;
                padding-top: 16px;
                border-top: 1px solid var(--color-border);
                color: var(--color-muted);
              ">&mdash;&mdash; THESIS B &mdash;&mdash;</div>
            </div>
          </div>
        </div>

        <svg data-ref="leaderLine" style="
          position: absolute; left: 0; top: 0; width: 100%; height: 100%;
          pointer-events: none; overflow: visible;
        ">
          <line x1="960" y1="580" x2="1100" y2="520" stroke="var(--color-accent)" stroke-width="1" style="opacity: 0;" data-ref="ll" />
          <text x="1105" y="516" fill="var(--color-accent)" font-family="var(--font-mono)" font-size="11" letter-spacing="0.15em" style="opacity: 0;" data-ref="llLabel">&#9698; KEY INSIGHT</text>
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
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const colA = host?.querySelector('[data-ref="colA"]') as HTMLElement;
		const colB = host?.querySelector('[data-ref="colB"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;

		const chMarkSvg = host?.querySelector('[data-ref="chMark"]') as SVGElement;
		const chH = chMarkSvg?.querySelector("line:nth-child(1)") as SVGLineElement;
		const chV = chMarkSvg?.querySelector("line:nth-child(2)") as SVGLineElement;

		const ll = host?.querySelector('[data-ref="ll"]') as SVGLineElement;
		const llLabel = host?.querySelector('[data-ref="llLabel"]') as SVGTextElement;

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

		tag.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		heading.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 400 },
		);

		chH.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 300,
			delay: 500,
		});

		chV.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
			...opts,
			duration: 300,
			delay: 550,
		});

		colA.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 700 },
		);

		colB.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 1000 },
		);

		ll.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 1300,
		});

		llLabel.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1500,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
