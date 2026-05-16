import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-ui-showcase",
	advances: [2.0, 4.0],
	voiceover:
		"UI showcases in Risograph. The product interface redrawn flat in two colors with solid fills and slight misregistration.",

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

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 100px;
          font-family: var(--font-display);
          font-size: 110px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          transform: rotate(-2deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">the console.</span>
            <span style="position: relative;">the console.</span>
          </span>
        </div>

        <div data-ref="ui" style="
          position: absolute;
          left: var(--safe-x);
          top: 320px;
          right: var(--safe-x);
          height: 700px;
          background: var(--color-fg);
          color: var(--color-bg);
          transform: rotate(-0.5deg);
          opacity: 0;
        ">
          <div style="position: absolute; inset: 0; left: 4px; top: 4px; background: var(--color-accent); mix-blend-mode: multiply; opacity: 0.6;"></div>

          <div style="position: relative; display: grid; grid-template-columns: 220px 1fr 260px; height: 100%;">
            <div style="padding: 24px; border-right: 3px solid var(--color-bg);">
              <div style="font-family: var(--font-display); font-size: 28px; color: var(--color-accent); margin-bottom: 24px;">BEACON</div>
              <div style="padding: 10px 12px; font-size: 18px; font-weight: 700;">&#9733; runs</div>
              <div style="padding: 10px 12px; font-size: 18px; font-weight: 700; background: var(--color-accent); color: var(--color-fg);">&#9733; memory</div>
              <div style="padding: 10px 12px; font-size: 18px; font-weight: 700;">&#9733; plans</div>
              <div style="padding: 10px 12px; font-size: 18px; font-weight: 700;">&#9733; tools</div>
              <div style="padding: 10px 12px; font-size: 18px; font-weight: 700;">&#9733; traces</div>
              <div style="padding: 10px 12px; font-size: 18px; font-weight: 700;">&#9733; evals</div>
            </div>

            <div style="padding: 28px;">
              <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.2em; font-weight: 700; margin-bottom: 22px;">TIMELINE &#183; 41AC</div>
              <svg width="100%" height="120">
                <line x1="20" y1="60" x2="98%" y2="60" stroke="var(--color-bg)" stroke-width="3" />
                <circle cx="8%" cy="60" r="10" fill="var(--color-bg)" />
                <circle cx="22%" cy="60" r="10" fill="var(--color-bg)" />
                <circle cx="36%" cy="60" r="10" fill="var(--color-bg)" />
                <circle cx="50%" cy="60" r="10" fill="var(--color-bg)" />
                <circle cx="64%" cy="60" r="10" fill="var(--color-bg)" />
                <circle cx="78%" cy="60" r="16" fill="var(--color-accent)" />
                <circle cx="92%" cy="60" r="10" fill="var(--color-bg)" />
              </svg>
              <div style="font-family: var(--font-display); font-size: 40px; color: var(--color-accent); margin-top: 16px;">&#9733; active: snap_006</div>
              <div style="font-family: var(--font-mono); font-size: 16px; margin-top: 16px; line-height: 1.7; font-weight: 600;">
                <div>[t05] tool.search &#8594; 12 results</div>
                <div style="color: var(--color-accent);">[t06] plan.revise &#8594; step 4 dropped</div>
                <div>[t07] memory.snap &#8594; ok</div>
              </div>
            </div>

            <div style="padding: 24px; border-left: 3px solid var(--color-bg);">
              <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.2em; font-weight: 700; margin-bottom: 16px;">MEMORY</div>
              <div style="font-family: var(--font-mono); font-size: 13px; padding: 6px 0; display: flex; justify-content: space-between; font-weight: 700;"><span>snap_000</span><span>0.0s</span></div>
              <div style="font-family: var(--font-mono); font-size: 13px; padding: 6px 0; display: flex; justify-content: space-between; font-weight: 700;"><span>snap_001</span><span>0.4s</span></div>
              <div style="font-family: var(--font-mono); font-size: 13px; padding: 6px 0; display: flex; justify-content: space-between; font-weight: 700;"><span>snap_002</span><span>0.8s</span></div>
              <div style="font-family: var(--font-mono); font-size: 13px; padding: 6px 0; display: flex; justify-content: space-between; font-weight: 700;"><span>snap_003</span><span>1.2s</span></div>
              <div style="font-family: var(--font-mono); font-size: 13px; padding: 6px 0; display: flex; justify-content: space-between; font-weight: 700;"><span>snap_004</span><span>1.6s</span></div>
              <div style="font-family: var(--font-mono); font-size: 13px; padding: 6px 0; display: flex; justify-content: space-between; font-weight: 700; color: var(--color-accent);"><span>snap_005</span><span>&#9679; now</span></div>
            </div>
          </div>
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
        ">&#9733; 08/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const ui = host?.querySelector('[data-ref="ui"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		headline.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		ui.animate(
			[
				{ opacity: 0, transform: "rotate(-0.5deg) scale(0.92)" },
				{ opacity: 1, transform: "rotate(-0.5deg) scale(1)" },
			],
			{ ...opts, duration: 350, delay: 600 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
