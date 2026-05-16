import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-feature",
	advances: [2.0, 4.0],
	voiceover:
		"Feature cards in Risograph. A cut-paper blob shape on the left with stacked memory slots, heavy display name and body on the right.",

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

        <svg data-ref="shape" style="position: absolute; left: 100px; top: 200px; overflow: visible; opacity: 0;" width="720" height="720">
          <path d="M 80 100 Q 360 -20 640 120 Q 720 380 580 600 Q 280 720 100 540 Q 20 320 80 100 Z" fill="var(--color-accent)" />
        </svg>

        <svg data-ref="slots" style="position: absolute; left: 160px; top: 260px; overflow: visible; opacity: 0;" width="700" height="700">
          <rect x="60" y="80" width="520" height="92" fill="var(--color-fg)" />
          <text x="90" y="140" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">snap_000</text>
          <text x="520" y="140" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">&#10003;</text>

          <rect x="60" y="200" width="520" height="92" fill="var(--color-fg)" />
          <text x="90" y="260" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">snap_001</text>
          <text x="520" y="260" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">&#10003;</text>

          <rect x="60" y="320" width="520" height="92" fill="var(--color-fg)" />
          <text x="90" y="380" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">snap_002</text>
          <text x="520" y="380" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-second)">&#8630;</text>

          <rect x="60" y="440" width="520" height="92" fill="var(--color-fg)" />
          <text x="90" y="500" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">snap_003</text>
          <text x="520" y="500" font-family="var(--font-mono)" font-weight="700" font-size="32" fill="var(--color-bg)">&#10003;</text>
        </svg>

        <div data-ref="tag" style="
          position: absolute;
          right: var(--safe-x);
          top: 180px;
          font-family: var(--font-mono);
          font-size: 22px;
          letter-spacing: 0.15em;
          font-weight: 700;
          color: var(--color-accent);
          opacity: 0;
        ">&#9733; FEATURE 01 / 03</div>

        <div data-ref="name" style="
          position: absolute;
          right: var(--safe-x);
          top: 240px;
          width: 720px;
          font-family: var(--font-display);
          font-size: 130px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          transform: rotate(-2deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">checkpoint memory.</span>
            <span style="position: relative;">checkpoint memory.</span>
          </span>
        </div>

        <div data-ref="body" style="
          position: absolute;
          right: var(--safe-x);
          top: 560px;
          width: 720px;
          font-size: 30px;
          line-height: 1.45;
          font-weight: 500;
          opacity: 0;
        ">we snapshot the agent's reasoning at every tool boundary. when a plan goes stale, the agent <span style="color: var(--color-accent); font-weight: 700;">rewinds</span> to the last correct point.</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 06/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const shape = host?.querySelector('[data-ref="shape"]') as SVGElement;
		const slots = host?.querySelector('[data-ref="slots"]') as SVGElement;
		const tag = host?.querySelector('[data-ref="tag"]') as HTMLElement;
		const name = host?.querySelector('[data-ref="name"]') as HTMLElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		shape.animate(
			[
				{ opacity: 0, transform: "rotate(-3deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-3deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 300 },
		);

		slots.animate(
			[
				{ opacity: 0, transform: "rotate(2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(2deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 500 },
		);

		tag.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 280, delay: 400 });

		name.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 700 },
		);

		body.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 280, delay: 1200 });

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
