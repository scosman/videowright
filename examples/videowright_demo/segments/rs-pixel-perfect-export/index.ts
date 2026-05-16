import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const COMMAND = "npx videowright render --output explainer.mp4";

const GRAIN_BG = `url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;)`;

export default defineSegment({
	id: "rs-pixel-perfect-export",
	advances: [7.59],
	voiceover:
		"One command renders a deterministic MP4. Not a screen recording. Frame by frame, pixel-exact.",

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
          z-index: 10;
        ">&#9733; 05/08 &#9733;</div>

        <!-- Export terminal -->
        <div data-ref="terminal-wrap" style="
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%) rotate(-0.5deg);
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
            width: 1380px; height: 540px;
            background: var(--color-bg);
            border: 3px solid var(--color-fg);
            display: flex; flex-direction: column;
            overflow: hidden;
          ">
            <div style="
              display: flex; align-items: center; gap: 10px;
              padding: 12px 16px;
              border-bottom: 3px solid var(--color-fg);
              background: var(--color-bg);
            ">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--color-accent);"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--color-second);"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--color-fg);"></div>
              <div style="
                flex: 1; text-align: center;
                font-family: var(--font-mono); font-size: 16px;
                color: var(--color-muted);
                letter-spacing: 0.03em;
              ">~/explainer &mdash; videowright render</div>
            </div>

            <div style="
              flex: 1;
              padding: 30px 36px;
              font-family: var(--font-mono);
              font-size: 26px;
              line-height: 1.5;
              color: var(--color-fg);
              display: flex; flex-direction: column; gap: 14px;
            ">
              <div>
                <span style="color: var(--color-accent); font-weight: 700;">$</span>
                <span data-ref="cmd"></span><span data-ref="caret">▌</span>
              </div>

              <div data-ref="progress-row" style="
                display: flex; align-items: center; gap: 14px;
                font-size: 22px;
                margin-top: 14px;
                opacity: 0;
              ">
                <div style="
                  flex: 1;
                  height: 28px;
                  border: 3px solid var(--color-fg);
                  position: relative;
                  overflow: hidden;
                ">
                  <div data-ref="progress-fill" style="
                    position: absolute; left: 0; top: 0; bottom: 0;
                    width: 0%;
                    background: var(--color-accent);
                  "></div>
                </div>
                <div data-ref="counter" style="
                  font-family: var(--font-mono);
                  font-size: 22px;
                  font-weight: 700;
                  min-width: 200px;
                  text-align: right;
                ">0000 / 4440</div>
              </div>

              <div data-ref="done-line" style="
                font-size: 22px;
                color: var(--color-accent);
                margin-top: 12px;
                opacity: 0;
                font-weight: 700;
              ">&#10003; wrote explainer.mp4 &nbsp;&middot;&nbsp; 1920&times;1080 &nbsp;&middot;&nbsp; 60fps</div>
            </div>
          </div>
        </div>

        <!-- Player window on top -->
        <div data-ref="player-wrap" style="
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%) rotate(-0.4deg);
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
            width: 1560px; height: 820px;
            background: var(--color-bg);
            border: 3px solid var(--color-fg);
            display: flex; flex-direction: column;
            overflow: hidden;
          ">
            <div style="
              display: flex; align-items: center; gap: 12px;
              padding: 14px 22px;
              border-bottom: 3px solid var(--color-fg);
              background: var(--color-bg);
            ">
              <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--color-accent);"></div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--color-second);"></div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: var(--color-fg);"></div>
              <div style="
                flex: 1; text-align: center;
                font-family: var(--font-mono); font-size: 16px;
                color: var(--color-fg);
                letter-spacing: 0.02em;
              ">explainer.mp4 &mdash; 01:14 &mdash; 1920&times;1080 &middot; 60fps</div>
              <div style="
                padding: 4px 10px;
                font-family: var(--font-mono);
                font-size: 14px;
                font-weight: 700;
                background: var(--color-accent);
                color: var(--color-bg);
                letter-spacing: 0.04em;
              ">FRAME-IDENTICAL &#10003;</div>
            </div>

            <!-- Player surface — shows the title-card content -->
            <div style="
              flex: 1;
              padding: 60px 80px 40px;
              position: relative;
              display: flex; flex-direction: column; justify-content: center;
            ">
              <div style="
                font-family: var(--font-mono);
                font-size: 18px;
                letter-spacing: 0.18em;
                font-weight: 600;
              ">&#9670; VIDEOWRIGHT &#183; v0.1</div>
              <div style="
                font-family: var(--font-display);
                font-size: 200px;
                line-height: 0.9;
                letter-spacing: -0.025em;
                margin-top: 12px;
              ">
                <span style="position: relative; display: inline-block;">
                  <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">Videowright.</span>
                  <span style="position: relative;">Videowright.</span>
                </span>
              </div>
              <div style="
                height: 10px;
                background: var(--color-accent);
                width: 1000px;
                margin-top: 20px;
                transform: rotate(-1deg);
                transform-origin: left center;
              "></div>
              <div style="
                font-family: var(--font-display);
                font-size: 56px;
                margin-top: 20px;
              ">build videos in <span style="color: var(--color-accent);">claude code.</span></div>
            </div>

            <!-- Scrubber -->
            <div style="
              padding: 14px 22px;
              border-top: 3px solid var(--color-fg);
              display: flex; align-items: center; gap: 16px;
            ">
              <div style="
                width: 44px; height: 44px;
                border: 3px solid var(--color-fg);
                display: flex; align-items: center; justify-content: center;
                font-size: 18px; color: var(--color-fg);
              ">&#9654;</div>
              <div style="font-family: var(--font-mono); font-size: 16px; font-weight: 600;">00:00</div>
              <div style="
                flex: 1;
                height: 8px;
                background: var(--color-bg);
                border: 2px solid var(--color-fg);
                position: relative;
              ">
                <div style="position: absolute; left: 0; top: -3px; width: 12px; height: 12px; background: var(--color-accent); border: 2px solid var(--color-fg);"></div>
              </div>
              <div style="font-family: var(--font-mono); font-size: 16px; font-weight: 600;">01:14</div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const terminalWrap = host?.querySelector('[data-ref="terminal-wrap"]') as HTMLElement;
		const cmd = host?.querySelector('[data-ref="cmd"]') as HTMLElement;
		const caret = host?.querySelector('[data-ref="caret"]') as HTMLElement;
		const progressRow = host?.querySelector('[data-ref="progress-row"]') as HTMLElement;
		const progressFill = host?.querySelector('[data-ref="progress-fill"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;
		const doneLine = host?.querySelector('[data-ref="done-line"]') as HTMLElement;
		const playerWrap = host?.querySelector('[data-ref="player-wrap"]') as HTMLElement;

		const stepEase = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: stepEase };

		// Terminal stamps in
		terminalWrap.animate(
			[
				{ opacity: 0, transform: "translate(-50%, -50%) rotate(-0.5deg) scale(0.95)" },
				{ opacity: 1, transform: "translate(-50%, -50%) rotate(-0.5deg) scale(1)" },
			],
			{ ...opts, duration: 280 },
		);

		// Command types
		await ctx.hold(360);
		const cmdStep = 1000 / COMMAND.length;
		for (let i = 0; i <= COMMAND.length; i++) {
			if (ctx.signal.aborted) return;
			cmd.textContent = COMMAND.slice(0, i);
			await ctx.hold(cmdStep);
		}
		caret.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 100,
		});

		// Progress
		await ctx.hold(140);
		progressRow.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 160,
		});
		progressFill.animate([{ width: "0%" }, { width: "100%" }], {
			...opts,
			duration: 1100,
			delay: 80,
		});

		const counterStart = ctx.clock();
		const counterDur = 1100;
		const counterStartTime = counterStart + 80;
		const counterTick = () => {
			if (ctx.signal.aborted) return;
			const elapsed = ctx.clock() - counterStartTime;
			const t = Math.max(0, Math.min(1, elapsed / counterDur));
			const cur = Math.floor(t * 4440);
			counter.textContent = `${cur.toString().padStart(4, "0")} / 4440`;
			if (t < 1) requestAnimationFrame(counterTick);
		};
		requestAnimationFrame(counterTick);

		await ctx.hold(1280);
		counter.textContent = "4440 / 4440";

		doneLine.animate(
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 240 },
		);

		// Player stamps in over the terminal
		await ctx.hold(420);
		playerWrap.animate(
			[
				{
					opacity: 0,
					transform: "translate(-50%, -50%) rotate(-0.4deg) scale(0.94)",
				},
				{
					opacity: 1,
					transform: "translate(-50%, -50%) rotate(-0.4deg) scale(1)",
				},
			],
			{ ...opts, duration: 280 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
