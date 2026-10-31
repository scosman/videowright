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
	id: "motion-engineering-sample-feature",
	advances: [2.5, 5.0],
	voiceover:
		"Feature cards in Motion Engineering. A wireframe schematic on the left with crosshair callouts, feature name and description on the right.",

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

          <div style="position: absolute; left: 80px; top: 100px; width: 760px; height: 760px;">
            <div data-ref="schLabel" style="
              font-family: var(--font-mono);
              font-size: 12px;
              letter-spacing: 0.25em;
              color: var(--color-muted);
              margin-bottom: 18px;
              opacity: 0;
            ">&mdash;&mdash; SCHEMATIC &middot; 06.1 &mdash;&mdash;</div>

            <svg data-ref="schematic" width="700" height="500" style="overflow: visible; opacity: 0;">
              <line x1="20" y1="140" x2="120" y2="140" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="20" y1="120" x2="20" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="120" y1="120" x2="120" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />

              <line x1="160" y1="140" x2="260" y2="140" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="160" y1="120" x2="160" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="260" y1="120" x2="260" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />

              <line x1="300" y1="140" x2="400" y2="140" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="300" y1="120" x2="300" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="400" y1="120" x2="400" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />

              <line x1="440" y1="140" x2="540" y2="140" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="440" y1="120" x2="440" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="540" y1="120" x2="540" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />

              <line x1="580" y1="140" x2="680" y2="140" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="580" y1="120" x2="580" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />
              <line x1="680" y1="120" x2="680" y2="160" stroke="var(--color-muted)" stroke-width="1.5" />

              <line data-ref="snap0" x1="70" y1="140" x2="70" y2="240" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 70px 140px; transform: scaleY(0);" />
              <circle data-ref="dot0" cx="70" cy="240" r="6" fill="var(--color-accent)" style="opacity: 0;" />

              <line data-ref="snap1" x1="210" y1="140" x2="210" y2="240" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 210px 140px; transform: scaleY(0);" />
              <circle data-ref="dot1" cx="210" cy="240" r="6" fill="var(--color-accent)" style="opacity: 0;" />

              <line data-ref="snap2" x1="350" y1="140" x2="350" y2="240" stroke="var(--color-accent)" stroke-width="1.5" style="transform-origin: 350px 140px; transform: scaleY(0);" />
              <circle data-ref="dot2" cx="350" cy="240" r="6" fill="var(--color-accent)" style="opacity: 0;" />

              <line data-ref="rewind" x1="490" y1="340" x2="210" y2="340" stroke="var(--cyan)" stroke-width="2" style="transform-origin: 490px 340px; transform: scaleX(0);" />
              <polygon data-ref="arrow" points="210,340 222,332 222,348" fill="var(--cyan)" style="opacity: 0;" />
              <text data-ref="rewindLabel" x="350" y="325" fill="var(--cyan)" font-family="var(--font-mono)" font-size="14" text-anchor="middle" style="opacity: 0;">REWIND &#8594; snap_002</text>

              <text x="20" y="108" fill="var(--color-muted)" font-family="var(--font-mono)" font-size="11" letter-spacing="0.15em">PLAN.STEP &#8594;</text>
              <text x="20" y="280" fill="var(--color-muted)" font-family="var(--font-mono)" font-size="11" letter-spacing="0.15em">SNAPSHOTS</text>
            </svg>
          </div>

          <div style="position: absolute; right: 80px; top: 100px; width: 700px;">
            <div data-ref="featureTag" style="
              font-family: var(--font-mono);
              font-size: 13px;
              letter-spacing: 0.25em;
              color: var(--color-accent);
              margin-bottom: 24px;
              opacity: 0;
            ">&#9698; FEATURE 01 / 03</div>

            <div data-ref="featureName" style="
              font-family: var(--font-display);
              font-weight: 500;
              font-size: 92px;
              margin-bottom: 36px;
              opacity: 0;
            ">Checkpoint memory.</div>

            <div data-ref="featureDesc" style="
              font-size: 26px;
              line-height: 1.5;
              color: var(--color-muted);
              margin-bottom: 40px;
              opacity: 0;
            ">Snapshots an agent's reasoning state at each tool boundary. When a plan goes stale, the agent rewinds to the last point its world model was correct.</div>

            <div data-ref="metrics" style="
              border-top: 1px solid var(--color-border);
              padding-top: 24px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              opacity: 0;
            ">
              <div>
                <div style="
                  font-family: var(--font-mono);
                  font-size: 11px;
                  letter-spacing: 0.2em;
                  color: var(--color-muted);
                ">SNAPSHOT/MIN</div>
                <div style="
                  font-family: var(--font-mono);
                  font-size: 36px;
                  color: var(--color-accent);
                  font-variant-numeric: tabular-nums;
                ">120</div>
              </div>
              <div>
                <div style="
                  font-family: var(--font-mono);
                  font-size: 11px;
                  letter-spacing: 0.2em;
                  color: var(--color-muted);
                ">RESTORE</div>
                <div style="
                  font-family: var(--font-mono);
                  font-size: 36px;
                  color: var(--color-accent);
                  font-variant-numeric: tabular-nums;
                ">9 ms</div>
              </div>
            </div>
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
		const schLabel = host?.querySelector('[data-ref="schLabel"]') as HTMLElement;
		const schematic = host?.querySelector('[data-ref="schematic"]') as SVGElement;
		const featureTag = host?.querySelector('[data-ref="featureTag"]') as HTMLElement;
		const featureName = host?.querySelector('[data-ref="featureName"]') as HTMLElement;
		const featureDesc = host?.querySelector('[data-ref="featureDesc"]') as HTMLElement;
		const metrics = host?.querySelector('[data-ref="metrics"]') as HTMLElement;
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

		featureTag.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		schLabel.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 200,
		});

		schematic.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 400,
			delay: 400,
		});

		featureName.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 500 },
		);

		for (let i = 0; i < 3; i++) {
			const snap = host?.querySelector(`[data-ref="snap${i}"]`) as SVGLineElement;
			const dot = host?.querySelector(`[data-ref="dot${i}"]`) as SVGCircleElement;
			snap.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
				...opts,
				duration: 300,
				delay: 700 + i * 120,
			});
			dot.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 200,
				delay: 900 + i * 120,
			});
		}

		featureDesc.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 900 },
		);

		const rewind = host?.querySelector('[data-ref="rewind"]') as SVGLineElement;
		const arrow = host?.querySelector('[data-ref="arrow"]') as SVGPolygonElement;
		const rewindLabel = host?.querySelector('[data-ref="rewindLabel"]') as SVGTextElement;

		rewind.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
			delay: 1400,
		});

		arrow.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1900,
		});

		rewindLabel.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1900,
		});

		metrics.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 1300 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
