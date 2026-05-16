import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const COMMAND = "npm install videowright";

const GRAIN_BG = `url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;)`;

export default defineSegment({
	id: "rs-install-cta",
	advances: [7.81],
	voiceover:
		"Paste a script into your coding agent. You'll have a video before your coffee's cold.",

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
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 80px;
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none; z-index: 30;
          background-image: ${GRAIN_BG};
          opacity: var(--grain-opacity); mix-blend-mode: multiply;
        "></div>

        <div style="
          position: absolute;
          right: var(--safe-x); top: 60px;
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--color-accent);
          transform: rotate(-3deg);
        ">&#9733; 08/08 &#9733;</div>

        <svg data-ref="star" style="position: absolute; left: 180px; top: 220px; opacity: 0;" width="180" height="180">
          <polygon points="90,0 112,68 180,68 124,108 146,180 90,140 34,180 56,108 0,68 68,68" fill="var(--color-accent)" />
        </svg>

        <svg data-ref="star-2" style="position: absolute; right: 200px; bottom: 240px; opacity: 0;" width="120" height="120">
          <polygon points="60,0 75,46 120,46 83,72 97,120 60,93 23,120 37,72 0,46 45,46" fill="var(--color-fg)" />
        </svg>

        <div data-ref="kicker" style="
          font-family: var(--font-mono);
          font-size: 26px;
          letter-spacing: 0.24em;
          font-weight: 600;
          color: var(--color-fg);
          opacity: 0;
        ">&#9670; READY IN ONE COMMAND &#9670;</div>

        <div data-ref="title" style="
          font-family: var(--font-display);
          font-size: 200px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          opacity: 0;
          margin-top: -40px;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">install</span>
            <span style="position: relative;">install</span>
          </span>
          <span style="color: var(--color-accent); display: inline-block; transform: rotate(-2deg); margin-left: 0.2em;">videowright.</span>
        </div>

        <!-- Terminal card -->
        <div data-ref="terminal-wrap" style="
          position: relative;
          opacity: 0;
        ">
          <div style="
            position: absolute;
            inset: 0;
            transform: translate(var(--misreg), var(--misreg));
            background: var(--color-accent);
            mix-blend-mode: multiply;
            opacity: 0.55;
            pointer-events: none;
          "></div>
          <div style="
            position: relative;
            width: 1100px;
            background: var(--color-bg);
            border: 3px solid var(--color-fg);
            padding: 28px 36px;
            font-family: var(--font-mono);
            font-size: 36px;
            font-weight: 500;
            color: var(--color-fg);
            display: flex; align-items: center; gap: 18px;
          ">
            <span style="color: var(--color-accent); font-weight: 700;">$</span>
            <span data-ref="cmd"></span><span data-ref="caret" style="color: var(--color-accent);">▌</span>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const star = host?.querySelector('[data-ref="star"]') as SVGElement;
		const star2 = host?.querySelector('[data-ref="star-2"]') as SVGElement;
		const kicker = host?.querySelector('[data-ref="kicker"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const terminalWrap = host?.querySelector('[data-ref="terminal-wrap"]') as HTMLElement;
		const cmd = host?.querySelector('[data-ref="cmd"]') as HTMLElement;
		const caret = host?.querySelector('[data-ref="caret"]') as HTMLElement;

		const stepEase = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: stepEase };

		star.animate(
			[
				{ opacity: 0, transform: "rotate(-12deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-12deg) scale(1)" },
			],
			{ ...opts, duration: 240 },
		);
		star2.animate(
			[
				{ opacity: 0, transform: "rotate(18deg) scale(0.8)" },
				{ opacity: 1, transform: "rotate(18deg) scale(1)" },
			],
			{ ...opts, duration: 240, delay: 200 },
		);

		kicker.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 220,
			delay: 280,
		});

		title.animate(
			[
				{ opacity: 0, transform: "scale(0.94)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...opts, duration: 320, delay: 580 },
		);

		terminalWrap.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 320, delay: 1100 },
		);

		// Type the command
		await ctx.hold(1500);
		const cmdStep = 900 / COMMAND.length;
		for (let i = 0; i <= COMMAND.length; i++) {
			if (ctx.signal.aborted) return;
			cmd.textContent = COMMAND.slice(0, i);
			await ctx.hold(cmdStep);
		}

		// Caret blinks for the rest of the hold
		const blink = () => {
			caret.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], {
				duration: 1000,
				iterations: Number.POSITIVE_INFINITY,
				easing: stepEase,
			});
		};
		blink();

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
