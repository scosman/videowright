import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "em-interactive-dev",
	advances: [5.129],
	voiceover: "Iterate in chat. The dev server hot-reloads.",

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
          <div>Plate / Iteration</div>
          <div>Live · localhost:5173</div>
        </div>

        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: 200px;
          bottom: var(--safe-y);
          display: grid;
          grid-template-columns: 760px 1fr;
          gap: 48px;
        ">
          <!-- LEFT: Claude Code TUI -->
          <div style="
            border: 1px solid var(--color-fg);
            background: var(--color-surface);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          ">
            <!-- title bar -->
            <div style="
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px 14px;
              border-bottom: 1px solid var(--color-fg);
              background: var(--color-bg);
            ">
              <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="width: 9px; height: 9px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <div style="
                flex: 1;
                text-align: center;
                font-family: var(--font-mono);
                font-size: 12px;
                letter-spacing: 0.04em;
                color: var(--color-muted);
              ">~/projects/videowright-demo &mdash; claude</div>
              <span style="width: 36px;"></span>
            </div>

            <!-- TUI body -->
            <div style="
              flex: 1;
              display: flex;
              flex-direction: column;
              padding: 22px 26px 18px;
              font-family: var(--font-mono);
              color: var(--color-fg);
              overflow: hidden;
            ">
              <!-- Conversation log -->
              <div style="flex: 1; font-size: 17px; line-height: 1.55; overflow: hidden;">
                <div data-ref="user-turn" style="opacity: 0;">
                  <div>
                    <span style="color: var(--color-accent);">&gt;</span>
                    <span data-ref="user-prompt" style="color: var(--color-fg);"></span>
                  </div>
                </div>

                <div data-ref="agent-turn" style="opacity: 0; margin-top: 22px;">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <span style="color: var(--color-accent); flex-shrink: 0;">&#9679;</span>
                    <div data-ref="agent-line" style="flex: 1; color: var(--color-fg);">Updating segments/title-card.tsx, styles/tokens.css&hellip;</div>
                  </div>
                  <div data-ref="working" style="
                    margin-top: 10px;
                    padding-left: 24px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: var(--color-accent);
                    opacity: 0;
                  ">
                    <span data-ref="spinner" style="display: inline-block; width: 1ch;"></span>
                    <span style="color: var(--color-fg);">Editing files&hellip;</span>
                    <span style="color: var(--color-muted); margin-left: 10px;">(esc to interrupt)</span>
                  </div>
                  <div data-ref="done-line" style="
                    margin-top: 14px;
                    padding-left: 24px;
                    font-size: 16px;
                    opacity: 0;
                  ">
                    <span style="color: var(--color-accent);">&#10003;</span>
                    <span style="color: var(--color-fg);"> Done. Hot-reloaded.</span>
                  </div>
                </div>
              </div>

              <!-- Input prompt -->
              <div style="
                margin-top: 14px;
                border: 1px solid var(--color-border);
                padding: 10px 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                background: var(--color-bg);
                font-size: 13px;
              ">
                <span style="color: var(--color-accent);">&gt;</span>
                <span style="color: var(--color-muted);">Try &ldquo;Edit the script&rdquo; or &ldquo;/help&rdquo;</span>
              </div>

              <!-- Footer status -->
              <div style="
                margin-top: 8px;
                display: flex;
                gap: 16px;
                font-family: var(--font-mono);
                font-size: 11px;
                color: var(--color-muted);
                letter-spacing: 0.04em;
              ">
                <span><span style="color: var(--color-accent);">&#9679;</span> claude-opus-4-7</span>
                <span>~22.1k tokens</span>
                <span style="margin-left: auto;">? for help</span>
              </div>
            </div>
          </div>

          <!-- RIGHT: browser preview panel -->
          <div style="
            border: 1px solid var(--color-fg);
            background: var(--color-surface);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
          ">
            <div style="
              height: 40px;
              border-bottom: 1px solid var(--color-fg);
              display: flex;
              align-items: center;
              padding: 0 16px;
              gap: 10px;
              font-family: var(--font-mono);
              font-size: 12px;
              color: var(--color-muted);
              letter-spacing: 0.16em;
              text-transform: uppercase;
            ">
              <span style="width: 8px; height: 8px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="width: 8px; height: 8px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="width: 8px; height: 8px; border: 1px solid var(--color-fg); border-radius: 50%;"></span>
              <span style="margin-left: 16px;">localhost:5173 · HMR</span>
            </div>

            <!-- HMR flash badge -->
            <div data-ref="hmr-flash" style="
              position: absolute;
              top: 56px;
              right: 16px;
              padding: 6px 12px;
              border: 1px solid var(--color-accent);
              color: var(--color-accent);
              font-family: var(--font-mono);
              font-size: 11px;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              opacity: 0;
            ">● Hot Reloaded</div>

            <!-- preview stage (before / after) -->
            <div style="position: relative; flex: 1; background: var(--color-bg);">
              <!-- BEFORE: basic off-brand card -->
              <div data-ref="before" style="
                position: absolute;
                inset: 0;
                background: #232730;
                color: #cdd1d8;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 16px;
                font-family: 'Helvetica Neue', sans-serif;
              ">
                <div style="font-size: 58px; font-weight: 600;">VideoRight</div>
                <div style="font-size: 22px; color: #8b919c;">Video Agent Tool</div>
              </div>

              <!-- AFTER: editorial-mono title card -->
              <div data-ref="after" style="
                position: absolute;
                inset: 0;
                opacity: 0;
                background: var(--color-bg);
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 0 56px;
                gap: 18px;
              ">
                <div data-ref="aft-tag" style="font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted); opacity: 0;">Vol. 01 / Product · 001</div>
                <div data-ref="aft-headline" style="font-family: var(--font-display); font-size: 86px; line-height: 0.94; opacity: 0;">Videowright<span style="color: var(--color-accent);">.</span></div>
                <div data-ref="aft-rule" style="height: 2px; width: 0; background: var(--color-accent);"></div>
                <div data-ref="aft-sub" style="font-family: var(--font-display); font-style: italic; font-size: 26px; opacity: 0;">Build videos in Claude Code.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const $ = (k: string) => host?.querySelector(`[data-ref="${k}"]`) as HTMLElement;
		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const fwd = { fill: "forwards" as const, easing: ease };

		// 0.0s — user turn fades in
		$("user-turn").animate(
			[
				{ opacity: 0, transform: "translateY(10px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 380 },
		);

		// 0.2s — type user prompt
		await ctx.hold(220);
		const prompt = $("user-prompt");
		await typeText(
			ctx,
			prompt,
			"update the title card to our latest branding (name, tagline, design guide, colors)",
			14,
		);

		await ctx.hold(160);

		// agent turn appears
		$("agent-turn").animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 280 },
		);
		await ctx.hold(200);

		// working spinner
		$("working").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 180 });
		const spinner = $("spinner");
		const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
		const totalSpinMs = 700;
		const spinStep = 90;
		const spinIters = Math.floor(totalSpinMs / spinStep);
		for (let i = 0; i < spinIters; i++) {
			if (ctx.signal.aborted) return;
			spinner.textContent = spinnerFrames[i % spinnerFrames.length];
			await ctx.hold(spinStep);
		}
		spinner.textContent = "";
		$("working").animate([{ opacity: 1 }, { opacity: 0 }], { ...fwd, duration: 160 });

		$("done-line").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 240 });
		await ctx.hold(180);

		// HMR flash + crossfade
		$("hmr-flash").animate(
			[
				{ opacity: 0, transform: "translateY(-4px)" },
				{ opacity: 1, transform: "translateY(0)" },
				{ opacity: 1 },
				{ opacity: 0 },
			],
			{ ...fwd, duration: 1600, easing: "ease-out" },
		);

		$("before").animate([{ opacity: 1 }, { opacity: 0 }], {
			...fwd,
			duration: 400,
		});
		$("after").animate([{ opacity: 0 }, { opacity: 1 }], {
			...fwd,
			duration: 400,
		});

		// mini reveal sequence inside the browser preview
		$("aft-tag").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 320, delay: 200 });
		$("aft-headline").animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 420, delay: 320 },
		);
		$("aft-rule").animate([{ width: "0px" }, { width: "320px" }], {
			...fwd,
			duration: 480,
			delay: 580,
		});
		$("aft-sub").animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 380, delay: 760 },
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
