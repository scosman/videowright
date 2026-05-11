import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "title-card",
	advances: [3.0],
	voiceover: "Videowright turns a coding agent into a video team.",

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

        <div data-ref="tag" style="
          position: absolute;
          left: 50%; top: 38%;
          transform: translate(-50%, -50%);
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.3em;
          color: var(--color-accent);
          opacity: 0;
        ">&#9698; PRODUCT &middot; 001</div>

        <div data-ref="title" style="
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-display);
          font-size: 200px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1;
          opacity: 0;
        ">Videowright</div>

        <svg data-ref="dimline" style="
          position: absolute;
          left: 50%; top: calc(50% + 110px);
          transform: translate(-50%, 0);
          overflow: visible;
        " width="900" height="40">
          <line data-ref="dim-main" x1="0" y1="20" x2="900" y2="20" stroke="var(--cyan)" stroke-width="1.5" style="transform-origin: 450px 20px; transform: scaleX(0);" />
          <line data-ref="dim-l" x1="0" y1="10" x2="0" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
          <line data-ref="dim-r" x1="900" y1="10" x2="900" y2="30" stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
        </svg>

        <div data-ref="subtitle" style="
          position: absolute;
          left: 50%; top: calc(50% + 170px);
          transform: translate(-50%, 0);
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 400;
          color: var(--color-muted);
          letter-spacing: 0.02em;
          opacity: 0;
        ">Build videos in Claude Code</div>

        <div style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        ">
          <span>FRAME 02</span>
          <span>X 0960.00</span>
          <span>Y 0540.00</span>
          <span style="margin-left: auto;">TITLE CARD</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const tag = host?.querySelector('[data-ref="tag"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const dimMain = host?.querySelector(
			'[data-ref="dim-main"]',
		) as SVGLineElement;
		const dimL = host?.querySelector('[data-ref="dim-l"]') as SVGLineElement;
		const dimR = host?.querySelector('[data-ref="dim-r"]') as SVGLineElement;

		tag.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 6px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 360, delay: 0 },
		);

		title.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 16px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 500, delay: 200 },
		);

		dimMain.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
			delay: 700,
		});
		dimL.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 700,
		});
		dimR.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1200,
		});

		subtitle.animate(
			[
				{ opacity: 0, transform: "translate(-50%, 6px)" },
				{ opacity: 1, transform: "translate(-50%, 0)" },
			],
			{ ...opts, duration: 360, delay: 900 },
		);

		// Deliberate hold — no motion flourishes after the entrance
		await ctx.hold(3000);
	},

	unmount() {
		host = null;
	},
});
