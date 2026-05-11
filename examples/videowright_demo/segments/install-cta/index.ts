import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "install-cta",
	advances: [10.0],
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
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div data-ref="title" style="
          position: absolute;
          left: 50%; top: 28%;
          transform: translate(-50%, -50%);
          font-family: var(--font-display);
          font-size: 88px;
          font-weight: 500;
          letter-spacing: -0.02em;
          opacity: 0;
        ">Install Videowright</div>

        <div data-ref="terminal" style="
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 900px;
          background: #0a0f14;
          border: 1px solid var(--color-accent);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          opacity: 0;
        ">
          <div style="
            display: flex; align-items: center; gap: 8px;
            padding: 10px 14px;
            background: #131c25;
            border-bottom: 1px solid var(--color-border);
          ">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #ff5f57;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #febc2e;"></div>
            <div style="width: 10px; height: 10px; border-radius: 50%; background: #28c840;"></div>
            <div style="
              margin-left: 14px;
              font-family: var(--font-mono); font-size: 12px;
              color: var(--color-muted);
              letter-spacing: 0.08em;
            ">~/your-project — zsh</div>
          </div>
          <div style="
            padding: 28px 32px;
            font-family: var(--font-mono);
            font-size: 28px;
            line-height: 1.4;
            color: var(--color-fg);
          ">
            <span style="color: var(--color-accent);">$</span> <span data-ref="cmd"></span><span data-ref="caret" style="
              display: inline-block; width: 12px; height: 28px;
              background: var(--color-accent);
              margin-left: 4px; vertical-align: middle;
              animation: blink 1s steps(2) infinite;
            "></span>
          </div>
          <style>@keyframes blink { 50% { opacity: 0; } }</style>
        </div>

        <div style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        ">
          <span>BEAT 06</span>
          <span>INSTALL</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const terminal = host?.querySelector('[data-ref="terminal"]') as HTMLElement;
		const cmd = host?.querySelector('[data-ref="cmd"]') as HTMLElement;

		title.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 12px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 500 },
		);

		terminal.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 16px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 500, delay: 300 },
		);

		await ctx.hold(1100);

		// Cursor blinks, then types
		await ctx.hold(700);
		const command = "npm install videowright";
		for (let i = 0; i <= command.length; i++) {
			if (ctx.signal.aborted) return;
			cmd.textContent = command.slice(0, i);
			await ctx.hold(75);
		}

		// Hold on the command — VO finishes (~3.5s after typing), then 5s hold
		// after audio end so the last frame breathes before the video ends.
		await ctx.hold(9400);
	},

	unmount() {
		host = null;
	},
});
