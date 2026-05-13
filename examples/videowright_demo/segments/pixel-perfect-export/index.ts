import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

// Renders the same look as the title-card segment, scaled down to fit inside the player.
function titleCardMarkup(): string {
	return `
    <div style="
      position: relative;
      width: 100%; height: 100%;
      background: var(--color-bg);
      overflow: hidden;
    ">
      <div style="
        position: absolute; inset: 0; pointer-events: none;
        background:
          linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 32px 32px,
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 32px 32px;
      "></div>

      <div style="
        position: absolute;
        left: 50%; top: 34%;
        transform: translate(-50%, -50%);
        font-family: var(--font-mono);
        font-size: 14px;
        letter-spacing: 0.3em;
        color: var(--color-accent);
      ">&#9698; PRODUCT &middot; 001</div>

      <div style="
        position: absolute;
        left: 50%; top: 50%;
        transform: translate(-50%, -50%);
        font-family: var(--font-display);
        font-size: 140px;
        font-weight: 500;
        letter-spacing: -0.02em;
        line-height: 1;
        color: var(--color-fg);
      ">Videowright</div>

      <svg style="
        position: absolute;
        left: 50%; top: calc(50% + 88px);
        transform: translate(-50%, 0);
        overflow: visible;
      " width="560" height="20">
        <line x1="0" y1="10" x2="560" y2="10" stroke="var(--cyan)" stroke-width="1.5" />
        <line x1="0" y1="4" x2="0" y2="16" stroke="var(--cyan)" stroke-width="1.5" />
        <line x1="560" y1="4" x2="560" y2="16" stroke="var(--cyan)" stroke-width="1.5" />
      </svg>

      <div style="
        position: absolute;
        left: 50%; top: calc(50% + 130px);
        transform: translate(-50%, 0);
        font-family: var(--font-display);
        font-size: 28px;
        font-weight: 400;
        color: var(--color-muted);
      ">Build videos in Claude Code</div>
    </div>
  `;
}

export default defineSegment({
	id: "pixel-perfect-export",
	advances: [10.0],
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
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <!-- Big CLI terminal, front and center -->
        <div data-ref="terminal" style="
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 1380px; height: 540px;
          background: #0a0f14;
          border: 1px solid var(--color-accent);
          box-shadow: 0 30px 90px rgba(0,0,0,0.6);
          display: flex; flex-direction: column;
          opacity: 0;
        ">
          <div style="
            display: flex; align-items: center; gap: 12px;
            padding: 16px 22px;
            background: #131c25;
            border-bottom: 1px solid var(--color-border);
          ">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #ff5f57;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #febc2e;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #28c840;"></div>
            <div style="
              margin-left: 22px;
              font-family: var(--font-mono); font-size: 20px;
              color: var(--color-muted);
              letter-spacing: 0.03em;
            ">~/explainer — videowright render</div>
          </div>
          <div style="
            flex: 1;
            padding: 32px 40px;
            font-family: var(--font-mono);
            font-size: 26px;
            line-height: 1.7;
            color: var(--color-fg);
            overflow: hidden;
          ">
            <div>
              <span style="color: var(--color-accent);">$</span>
              <span data-ref="cmd"></span><span data-ref="caret" style="
                display: inline-block; width: 12px; height: 26px;
                background: var(--color-accent);
                margin-left: 3px; vertical-align: middle;
                animation: blink 1s steps(2) infinite;
              "></span>
            </div>
            <div data-ref="render-log" style="
              margin-top: 26px;
              color: var(--color-muted);
              font-size: 24px;
              display: none;
            ">
              <div data-ref="render-progress" style="
                font-family: var(--font-mono);
                letter-spacing: 0.04em;
              "></div>
              <div data-ref="render-meta" style="
                margin-top: 12px;
                font-family: var(--font-mono);
                font-size: 22px;
                color: var(--cyan);
                letter-spacing: 0.03em;
              "></div>
            </div>
          </div>
          <style>@keyframes blink { 50% { opacity: 0; } }</style>
        </div>

        <!-- Video player window — opens larger than the export terminal -->
        <div data-ref="player" style="
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%) scale(0.85);
          width: 1560px; height: 820px;
          background: #0a0f14;
          border: 1px solid var(--color-accent);
          box-shadow: 0 40px 100px rgba(0,0,0,0.7),
            0 0 0 1px rgba(255, 136, 0, 0.15) inset;
          display: flex; flex-direction: column;
          opacity: 0;
          z-index: 3;
        ">
          <!-- Player chrome -->
          <div style="
            display: flex; align-items: center; gap: 12px;
            padding: 16px 22px;
            background: #131c25;
            border-bottom: 1px solid var(--color-border);
          ">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #ff5f57;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #febc2e;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #28c840;"></div>
            <div style="
              margin-left: 22px;
              font-family: var(--font-mono); font-size: 20px;
              color: var(--color-muted);
              letter-spacing: 0.03em;
            ">explainer.mp4 — 01:14 — 1920×1080 · 60fps</div>
            <div style="
              margin-left: auto;
              font-family: var(--font-mono); font-size: 16px;
              color: var(--color-accent);
              letter-spacing: 0.12em;
            ">FRAME-IDENTICAL ✓</div>
          </div>

          <!-- Video surface -->
          <div data-ref="player-stage" style="
            flex: 1;
            background: #000;
            position: relative;
            overflow: hidden;
          ">
            ${titleCardMarkup()}
          </div>

          <!-- Player controls -->
          <div style="
            display: flex; align-items: center; gap: 20px;
            padding: 16px 26px;
            background: #0d1217;
            border-top: 1px solid var(--color-border);
          ">
            <!-- Play button -->
            <div style="
              width: 36px; height: 36px;
              display: flex; align-items: center; justify-content: center;
              color: var(--color-fg);
            ">
              <svg width="18" height="20" viewBox="0 0 14 16">
                <polygon points="0,0 14,8 0,16" fill="var(--color-fg)" />
              </svg>
            </div>

            <!-- Current time -->
            <div style="
              font-family: var(--font-mono); font-size: 18px;
              color: var(--color-fg);
              letter-spacing: 0.04em;
              min-width: 60px;
            ">00:00</div>

            <!-- Scrubber -->
            <div style="
              flex: 1;
              position: relative;
              height: 5px;
              background: var(--color-border);
            ">
              <div style="
                position: absolute; left: 0; top: 0;
                width: 0%; height: 100%;
                background: var(--color-accent);
              "></div>
              <div style="
                position: absolute; left: 0; top: 50%;
                width: 16px; height: 16px;
                background: var(--color-accent);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(255, 136, 0, 0.6);
              "></div>
            </div>

            <!-- Total time -->
            <div style="
              font-family: var(--font-mono); font-size: 18px;
              color: var(--color-muted);
              letter-spacing: 0.04em;
              min-width: 60px;
              text-align: right;
            ">01:14</div>

            <!-- Volume / fullscreen icons -->
            <div style="display: flex; gap: 18px; color: var(--color-muted);">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
                <path d="M2 5.5h3l4-3v11l-4-3H2z" />
                <path d="M11 4.5c1.5 1 1.5 6 0 7" />
              </svg>
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
                <path d="M1 1h5M1 1v5M15 1h-5M15 1v5M1 15h5M1 15v-5M15 15h-5M15 15v-5" />
              </svg>
            </div>
          </div>
        </div>

        <div style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        ">
          <span>BEAT 04A</span>
          <span>PIXEL-PERFECT EXPORT</span>
          <span style="margin-left: auto;">DETERMINISTIC ✓</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const terminal = host?.querySelector('[data-ref="terminal"]') as HTMLElement;
		const cmd = host?.querySelector('[data-ref="cmd"]') as HTMLElement;
		const renderLog = host?.querySelector('[data-ref="render-log"]') as HTMLElement;
		const renderProgress = host?.querySelector('[data-ref="render-progress"]') as HTMLElement;
		const renderMeta = host?.querySelector('[data-ref="render-meta"]') as HTMLElement;
		const player = host?.querySelector('[data-ref="player"]') as HTMLElement;

		// 1) Terminal fades in
		terminal.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 12px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 400 },
		);

		await ctx.hold(500);

		// 2) Type the render command (snappier)
		const command = "npx videowright render --output explainer.mp4";
		for (let i = 0; i <= command.length; i++) {
			if (ctx.signal.aborted) return;
			cmd.textContent = command.slice(0, i);
			await ctx.hold(28);
		}

		await ctx.hold(200);

		// 3) Render progress (faster bar)
		renderLog.style.display = "block";
		const totalFrames = 60;
		const renderDurMs = 1100;
		const stepMs = renderDurMs / totalFrames;
		for (let i = 0; i <= totalFrames; i++) {
			if (ctx.signal.aborted) return;
			const pct = Math.round((i / totalFrames) * 100);
			const filled = Math.round((i / totalFrames) * 40);
			const bar = "█".repeat(filled) + "░".repeat(40 - filled);
			renderProgress.textContent = `[${bar}] ${pct.toString().padStart(3, " ")}%`;
			renderMeta.textContent = `frame ${i * 74}/${totalFrames * 74} · 4440/4440 frames · 60fps`;
			await ctx.hold(stepMs);
		}
		renderProgress.textContent = `[${"█".repeat(40)}] 100%`;
		renderMeta.textContent = "✓ wrote explainer.mp4 · 4440 frames · 1.1s";

		await ctx.hold(350);

		// 4) Player opens, covering the export terminal
		player.animate(
			[
				{ opacity: 0, transform: "translate(-50%, -50%) scale(0.85)" },
				{ opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
			],
			{ ...opts, duration: 450 },
		);

		// Player visible for the rest of the segment — hold on the title card frame.
		await ctx.hold(3700);
	},

	unmount() {
		host = null;
	},
});
