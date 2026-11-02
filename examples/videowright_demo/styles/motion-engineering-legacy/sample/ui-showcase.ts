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
	id: "motion-engineering-sample-ui-showcase",
	advances: [2.5, 5.0],
	voiceover:
		"UI showcases in Motion Engineering. A wireframe blueprint of the app with amber leader-line callouts pointing to key areas.",

	mount(el) {
		host = el;

		const sidebarItems = ["Runs", "Memory", "Plans", "Tools", "Traces", "Evals"];
		const sidebarHtml = sidebarItems
			.map(
				(x, i) =>
					`<div style="
            padding: 8px 10px;
            font-family: var(--font-mono);
            font-size: 14px;
            color: ${i === 1 ? "var(--color-accent)" : "var(--color-muted)"};
            ${i === 1 ? "background: rgba(255,136,0,0.08); border-left: 2px solid var(--color-accent);" : "border-left: 2px solid transparent;"}
          ">${x}</div>`,
			)
			.join("");

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
            position: absolute; left: 80px; top: 60px;
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.25em;
            color: var(--color-accent);
            opacity: 0;
          ">&#9698; FIG. 08 &middot; BEACON.CONSOLE v0.4 &middot; ANNOTATED</div>

          <div data-ref="mock" style="
            position: absolute; left: 80px; top: 120px; right: 80px; bottom: 60px;
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            opacity: 0;
          ">
            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 220px; border-right: 1px solid var(--color-border); padding: 20px;">
              <div style="
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.25em;
                color: var(--color-muted);
                margin-bottom: 16px;
              ">BEACON</div>
              ${sidebarHtml}
            </div>

            <div style="
              position: absolute; left: 220px; right: 280px; top: 0; height: 55%;
              padding: 24px; border-bottom: 1px solid var(--color-border);
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.25em;
                color: var(--color-muted);
              ">TIMELINE &middot; session 41ac</div>
              <svg width="100%" height="80" style="margin-top: 20px;">
                <line x1="0" y1="40" x2="100%" y2="40" stroke="var(--color-muted)" stroke-width="1" />
              </svg>
              <div style="
                font-family: var(--font-mono);
                font-size: 13px;
                color: var(--color-fg);
                margin-top: 16px;
              ">&bull; Active: snap_006 &middot; plan v3 &middot; revising</div>
            </div>

            <div style="
              position: absolute; left: 220px; right: 280px; bottom: 0; top: 55%;
              padding: 24px;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.25em;
                color: var(--color-muted);
              ">TRACE</div>
              <div style="font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); margin-top: 8px;">[t05] tool.search &#8594; 12 results</div>
              <div style="font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); margin-top: 8px;">[t06] plan.revise &#8594; step 4 dropped</div>
              <div style="font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); margin-top: 8px;">[t07] memory.snap &#8594; ok</div>
            </div>

            <div style="
              position: absolute; right: 0; top: 0; bottom: 0; width: 280px;
              border-left: 1px solid var(--color-border); padding: 20px;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.25em;
                color: var(--color-muted);
                margin-bottom: 16px;
              ">MEMORY</div>
              <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); padding: 5px 0;">snap_000 &middot; 0.2s</div>
              <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); padding: 5px 0;">snap_001 &middot; 0.6s</div>
              <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-muted); padding: 5px 0;">snap_002 &middot; 1.0s</div>
              <div style="font-family: var(--font-mono); font-size: 12px; color: var(--color-accent); padding: 5px 0;">snap_003 &middot; 1.4s</div>
            </div>
          </div>
        </div>

        <svg data-ref="callouts" style="
          position: absolute; inset: 0; pointer-events: none; width: 100%; height: 100%;
          opacity: 0;
        ">
          <line data-ref="cl0" x1="380" y1="280" x2="850" y2="140" stroke="var(--color-accent)" stroke-width="1.5" style="opacity: 0;" />
          <circle cx="380" cy="280" r="5" fill="var(--color-accent)" style="opacity: 0;" data-ref="cd0" />
          <text data-ref="ct0" x="855" y="136" fill="var(--color-accent)" font-family="var(--font-mono)" font-size="13" letter-spacing="0.15em" style="opacity: 0;">A &middot; TIMELINE</text>
          <text x="855" y="154" fill="var(--color-muted)" font-family="var(--font-mono)" font-size="11" style="opacity: 0;" data-ref="cd0b">Live agent steps with checkpoint markers.</text>

          <line data-ref="cl1" x1="1100" y1="460" x2="1450" y2="600" stroke="var(--color-accent)" stroke-width="1.5" style="opacity: 0;" />
          <circle cx="1100" cy="460" r="5" fill="var(--color-accent)" style="opacity: 0;" data-ref="cd1" />
          <text data-ref="ct1" x="1455" y="596" fill="var(--color-accent)" font-family="var(--font-mono)" font-size="13" letter-spacing="0.15em" style="opacity: 0;">B &middot; MEMORY</text>
          <text x="1455" y="614" fill="var(--color-muted)" font-family="var(--font-mono)" font-size="11" style="opacity: 0;" data-ref="cd1b">Active snapshot ring (last 12 minutes).</text>

          <line data-ref="cl2" x1="280" y1="720" x2="140" y2="820" stroke="var(--color-accent)" stroke-width="1.5" style="opacity: 0;" />
          <circle cx="280" cy="720" r="5" fill="var(--color-accent)" style="opacity: 0;" data-ref="cd2" />
          <text data-ref="ct2" x="145" y="816" fill="var(--color-accent)" font-family="var(--font-mono)" font-size="13" letter-spacing="0.15em" style="opacity: 0;">C &middot; CONTROLS</text>
          <text x="145" y="834" fill="var(--color-muted)" font-family="var(--font-mono)" font-size="11" style="opacity: 0;" data-ref="cd2b">Rewind, pin, branch.</text>
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
		const mock = host?.querySelector('[data-ref="mock"]') as HTMLElement;
		const callouts = host?.querySelector('[data-ref="callouts"]') as SVGElement;
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

		tag.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		mock.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 400,
			delay: 400,
		});

		callouts.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 800,
		});

		for (let i = 0; i < 3; i++) {
			const line = host?.querySelector(`[data-ref="cl${i}"]`) as SVGLineElement;
			const dot = host?.querySelector(`[data-ref="cd${i}"]`) as SVGCircleElement;
			const label = host?.querySelector(`[data-ref="ct${i}"]`) as SVGTextElement;
			const desc = host?.querySelector(`[data-ref="cd${i}b"]`) as SVGTextElement;

			line.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 300,
				delay: 1000 + i * 250,
			});

			dot.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 200,
				delay: 1000 + i * 250,
			});

			label.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 200,
				delay: 1400 + i * 250,
			});

			desc.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 200,
				delay: 1400 + i * 250,
			});
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
