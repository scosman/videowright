import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "em-pixel-perfect-export",
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
        <!-- top rule + labels -->
        <div style="position: absolute; left: var(--safe-x); right: var(--safe-x); top: var(--safe-y); height: 1px; background: var(--color-border);"></div>
        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: calc(var(--safe-y) + 22px);
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 14px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-muted);
        ">
          <div>Plate / Render</div>
          <div data-ref="state-tag">Building…</div>
        </div>

        <!-- TERMINAL CARD (centered, large) -->
        <div data-ref="term" style="
          position: absolute;
          left: 220px;
          right: 220px;
          top: 240px;
          bottom: 200px;
          background: var(--color-surface);
          border: 1px solid var(--color-fg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
        ">
          <div style="
            height: 48px;
            border-bottom: 1px solid var(--color-fg);
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 10px;
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
          ">
            <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
            <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
            <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
            <span style="margin-left: 16px;">~/explainer · videowright render</span>
          </div>
          <div style="flex: 1; padding: 38px 44px; display: flex; flex-direction: column; gap: 28px; font-family: var(--font-mono); font-size: 24px; color: var(--color-fg);">
            <div>
              <span style="color: var(--color-accent); margin-right: 14px;">$</span>
              <span data-ref="cmd"></span><span data-ref="caret" style="display: inline-block; width: 0.5em; height: 1em; background: var(--color-fg); margin-left: 2px; vertical-align: -2px;"></span>
            </div>

            <div data-ref="progress-row" style="display: flex; flex-direction: column; gap: 12px; opacity: 0;">
              <div style="display: flex; justify-content: space-between; font-size: 18px; color: var(--color-muted); letter-spacing: 0.08em;">
                <span>Rendering frames</span>
                <span><span data-ref="frame-count">0</span> / 4440</span>
              </div>
              <div style="height: 4px; background: var(--color-border); position: relative;">
                <div data-ref="progress-fill" style="position: absolute; left: 0; top: 0; bottom: 0; width: 0%; background: var(--color-fg);"></div>
              </div>
            </div>

            <div data-ref="done-row" style="font-size: 20px; color: var(--color-fg); opacity: 0;">
              <span style="color: var(--color-accent); margin-right: 14px;">✓</span> wrote explainer.mp4 · 1920×1080 · 60fps
            </div>
          </div>
        </div>

        <!-- PLAYER CARD (opens over terminal) -->
        <div data-ref="player" style="
          position: absolute;
          left: 160px;
          right: 160px;
          top: 200px;
          bottom: 160px;
          background: var(--color-bg);
          border: 1px solid var(--color-fg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
        ">
          <div style="
            height: 48px;
            border-bottom: 1px solid var(--color-fg);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 18px;
            gap: 10px;
            font-family: var(--font-mono);
            font-size: 13px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--color-muted);
          ">
            <div style="display: flex; gap: 10px; align-items: center;">
              <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="margin-left: 12px;">explainer.mp4 · 01:14 · 1920×1080 · 60fps</span>
            </div>
            <div style="color: var(--color-accent); font-weight: 500;">Frame-Identical ✓</div>
          </div>

          <!-- video surface (renders the title card content) -->
          <div style="flex: 1; position: relative; background: var(--color-bg); padding: 56px 72px; display: flex; flex-direction: column; justify-content: center; gap: 28px;">
            <div style="font-family: var(--font-mono); font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted);">Vol. 01 / Product · 001</div>
            <div style="font-family: var(--font-display); font-size: 140px; line-height: 0.95;">Videowright<span style="color: var(--color-accent); font-style: italic;">.</span></div>
            <div style="height: 2px; width: 540px; background: var(--color-accent);"></div>
            <div style="font-family: var(--font-display); font-style: italic; font-size: 40px; line-height: 1.1;">Build videos in Claude Code.</div>
          </div>

          <!-- player controls -->
          <div style="
            height: 56px;
            border-top: 1px solid var(--color-fg);
            display: flex;
            align-items: center;
            padding: 0 18px;
            gap: 16px;
            font-family: var(--font-mono);
            font-size: 13px;
            color: var(--color-muted);
          ">
            <!-- play triangle -->
            <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="2,1 13,7 2,13" fill="var(--color-fg)"/></svg>
            <span>00:00</span>
            <div style="flex: 1; height: 2px; background: var(--color-border); position: relative;">
              <div style="position: absolute; left: 0; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-fg);"></div>
            </div>
            <span>01:14</span>
            <span style="margin-left: 8px;">♪</span>
            <span>⤢</span>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const $ = (k: string) => host?.querySelector(`[data-ref="${k}"]`) as HTMLElement;
		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const fwd = { fill: "forwards" as const, easing: ease };

		// fade in terminal
		$("term").animate(
			[
				{ opacity: 0, transform: "translateY(10px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 400 },
		);

		// caret blink
		$("caret").animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 600,
			iterations: Number.POSITIVE_INFINITY,
			direction: "alternate",
			easing: "steps(1)",
		});

		await ctx.hold(400);

		// type the command
		const cmd = $("cmd");
		await typeText(ctx, cmd, "npx videowright render --output explainer.mp4", 32);
		await ctx.hold(280);

		// progress row appears and fills
		$("progress-row").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 280 });
		$("state-tag").textContent = "Rendering…";

		const fill = $("progress-fill");
		const count = $("frame-count");

		fill.animate([{ width: "0%" }, { width: "100%" }], {
			...fwd,
			duration: 1500,
			easing: "linear",
		});

		// frame counter ticks up
		const total = 4440;
		const steps = 30;
		const stepMs = 1500 / steps;
		for (let i = 0; i <= steps; i++) {
			count.textContent = Math.round((total * i) / steps).toLocaleString();
			await ctx.hold(stepMs);
		}

		// done line
		$("done-row").animate(
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 320 },
		);
		$("state-tag").textContent = "Done ✓";
		await ctx.hold(400);

		// player slides up over the terminal
		$("player").animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 520 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});

async function typeText(
	ctx: { hold: (ms: number) => Promise<void> },
	el: HTMLElement,
	text: string,
	perChar: number,
) {
	el.textContent = "";
	for (let i = 0; i < text.length; i++) {
		el.textContent = text.slice(0, i + 1);
		await ctx.hold(perChar);
	}
}
