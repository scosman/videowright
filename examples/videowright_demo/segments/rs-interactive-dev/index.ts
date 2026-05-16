import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const CLAUDE_ORANGE = "#d97757";

const MASCOT = `  ▐▛███▜▌
 ▝▜█████▛▘
   ▘▘ ▝▝`;

const USER_PROMPT_TEXT =
	"update the title card to our latest branding (name, tagline, design guide, colors), and add some motion";
const AGENT_LINE = "Updating segments/title-card.tsx, styles/tokens.css…";
const AGENT_DONE = "Done. Hot-reloaded.";

const GRAIN_BG = `url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;)`;

export default defineSegment({
	id: "rs-interactive-dev",
	advances: [5.129],
	voiceover: "Iterate in chat. The dev server hot-reloads. Type a change. See it.",

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
        display: flex;
        gap: 40px;
        padding: 60px;
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
        ">&#9733; 04/08 &#9733;</div>

        <!-- LEFT: Claude Code TUI (40%) -->
        <div data-ref="tui-wrap" style="
          flex: 0 0 40%;
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
            height: 100%;
            background: #0c0c0c;
            border: 3px solid var(--color-fg);
            display: flex; flex-direction: column;
            overflow: hidden;
          ">
            <div style="
              display: flex; align-items: center; gap: 10px;
              padding: 12px 16px;
              background: #1c1c1c;
              border-bottom: 1px solid #2a2a2a;
            ">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #febc2e;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #28c840;"></div>
              <div style="
                flex: 1; text-align: center;
                font-family: var(--font-mono); font-size: 13px;
                color: #999;
              ">~/projects/videowright-demo &mdash; claude</div>
            </div>

            <div style="
              flex: 1;
              padding: 24px 28px;
              font-family: var(--font-mono);
              color: #e5e5e5;
              font-size: 18px;
              line-height: 1.5;
              display: flex; flex-direction: column;
            ">
              <div style="
                display: flex; gap: 14px; align-items: flex-start;
                padding-bottom: 16px;
                border-bottom: 1px dashed #2a2a2a;
                margin-bottom: 18px;
              ">
                <pre style="margin: 0; font-family: var(--font-mono); font-size: 14px; line-height: 1.1; color: ${CLAUDE_ORANGE};">${MASCOT}</pre>
                <div style="color: ${CLAUDE_ORANGE}; font-size: 16px;">&#10027; Claude Code</div>
              </div>

              <div style="flex: 1; overflow: hidden;">
                <div>
                  <span style="color: ${CLAUDE_ORANGE};">&gt;</span>
                  <span data-ref="user-prompt" style="color: #e5e5e5;"></span><span data-ref="user-caret" style="color: #e5e5e5;">▌</span>
                </div>

                <div data-ref="agent-line" style="margin-top: 22px; opacity: 0;">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <span style="color: ${CLAUDE_ORANGE}; flex-shrink: 0;">&#9679;</span>
                    <span data-ref="agent-text" style="color: #e5e5e5;"></span>
                  </div>
                  <div data-ref="working" style="
                    margin-top: 10px; padding-left: 26px;
                    display: flex; align-items: center; gap: 12px;
                    font-size: 16px; color: ${CLAUDE_ORANGE};
                    opacity: 0;
                  ">
                    <span data-ref="spinner" style="display: inline-block; width: 1ch;"></span>
                    <span style="color: #ccc;">Editing&hellip;</span>
                  </div>
                </div>

                <div data-ref="agent-done" style="margin-top: 22px; opacity: 0;">
                  <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <span style="color: ${CLAUDE_ORANGE}; flex-shrink: 0;">&#9679;</span>
                    <span><span style="color: #9fc77a;">&#10003;</span> <span style="color: #e5e5e5;">${AGENT_DONE}</span></span>
                  </div>
                </div>
              </div>

              <div style="
                margin-top: 12px;
                border: 1px solid #2a2a2a;
                padding: 10px 14px;
                background: #141414;
                font-size: 14px;
                color: #5a5a5a;
              "><span style="color: ${CLAUDE_ORANGE};">&gt;</span>&nbsp;&nbsp;Try "Edit the script" or "/help"</div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Browser (60%) -->
        <div data-ref="browser-wrap" style="
          flex: 1;
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
            height: 100%;
            background: var(--color-bg);
            border: 3px solid var(--color-fg);
            display: flex; flex-direction: column;
            overflow: hidden;
          ">
            <!-- Browser chrome -->
            <div style="
              display: flex; align-items: center; gap: 12px;
              padding: 12px 18px;
              border-bottom: 3px solid var(--color-fg);
              background: var(--color-bg);
            ">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #febc2e;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #28c840;"></div>
              <div style="
                flex: 1;
                padding: 6px 14px;
                font-family: var(--font-mono);
                font-size: 14px;
                color: var(--color-fg);
                border: 2px solid var(--color-fg);
                background: var(--color-bg);
                letter-spacing: 0.02em;
              ">localhost:5173 &nbsp;&nbsp; <span style="color: var(--color-accent); font-weight: 700;">&#9679; HMR</span></div>
              <div data-ref="hmr-flash" style="
                padding: 6px 12px;
                font-family: var(--font-mono);
                font-size: 13px;
                font-weight: 700;
                background: var(--color-accent);
                color: var(--color-bg);
                opacity: 0;
              ">&#9679; HOT RELOADED</div>
            </div>

            <!-- Browser stage -->
            <div style="flex: 1; position: relative; overflow: hidden;">
              <!-- Off-brand "before" card -->
              <div data-ref="before-card" style="
                position: absolute; inset: 0;
                background: #1e2638;
                color: #c8c8c8;
                display: flex; flex-direction: column; justify-content: center;
                padding: 0 80px;
                font-family: Helvetica, Arial, sans-serif;
              ">
                <div style="font-size: 88px; font-weight: 400; letter-spacing: -0.01em;">VideoRight</div>
                <div style="font-size: 28px; opacity: 0.7; margin-top: 12px;">Video Agent Tool</div>
              </div>

              <!-- After: real riso title card -->
              <div data-ref="after-card" style="
                position: absolute; inset: 0;
                background: var(--color-bg);
                color: var(--color-fg);
                opacity: 0;
                padding: 60px 80px;
              ">
                <div data-ref="ac-star" style="position: absolute; left: 60px; top: 60px; opacity: 0;">
                  <svg width="80" height="80">
                    <polygon points="40,0 50,30 80,30 55,50 65,80 40,62 15,80 25,50 0,30 30,30" fill="var(--color-accent)" />
                  </svg>
                </div>
                <div data-ref="ac-kicker" style="
                  font-family: var(--font-mono);
                  font-size: 16px;
                  letter-spacing: 0.18em;
                  font-weight: 600;
                  margin-top: 140px;
                  opacity: 0;
                ">&#9670; VIDEOWRIGHT &#183; v0.1</div>
                <div data-ref="ac-title" style="
                  font-family: var(--font-display);
                  font-size: 140px;
                  line-height: 0.9;
                  letter-spacing: -0.025em;
                  margin-top: 10px;
                  opacity: 0;
                ">
                  <span style="position: relative; display: inline-block;">
                    <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">Videowright.</span>
                    <span style="position: relative;">Videowright.</span>
                  </span>
                </div>
                <div data-ref="ac-rule" style="
                  height: 8px;
                  background: var(--color-accent);
                  width: 0;
                  margin-top: 18px;
                  transform: rotate(-1deg);
                  transform-origin: left center;
                "></div>
                <div data-ref="ac-sub" style="
                  font-family: var(--font-display);
                  font-size: 44px;
                  color: var(--color-fg);
                  margin-top: 18px;
                  opacity: 0;
                ">build videos in <span style="color: var(--color-accent);">claude code.</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const tuiWrap = host?.querySelector('[data-ref="tui-wrap"]') as HTMLElement;
		const browserWrap = host?.querySelector('[data-ref="browser-wrap"]') as HTMLElement;
		const userPrompt = host?.querySelector('[data-ref="user-prompt"]') as HTMLElement;
		const userCaret = host?.querySelector('[data-ref="user-caret"]') as HTMLElement;
		const agentLine = host?.querySelector('[data-ref="agent-line"]') as HTMLElement;
		const agentText = host?.querySelector('[data-ref="agent-text"]') as HTMLElement;
		const working = host?.querySelector('[data-ref="working"]') as HTMLElement;
		const spinner = host?.querySelector('[data-ref="spinner"]') as HTMLElement;
		const agentDone = host?.querySelector('[data-ref="agent-done"]') as HTMLElement;
		const hmrFlash = host?.querySelector('[data-ref="hmr-flash"]') as HTMLElement;
		const beforeCard = host?.querySelector('[data-ref="before-card"]') as HTMLElement;
		const afterCard = host?.querySelector('[data-ref="after-card"]') as HTMLElement;
		const acStar = host?.querySelector('[data-ref="ac-star"]') as HTMLElement;
		const acKicker = host?.querySelector('[data-ref="ac-kicker"]') as HTMLElement;
		const acTitle = host?.querySelector('[data-ref="ac-title"]') as HTMLElement;
		const acRule = host?.querySelector('[data-ref="ac-rule"]') as HTMLElement;
		const acSub = host?.querySelector('[data-ref="ac-sub"]') as HTMLElement;

		const stepEase = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: stepEase };

		// Both panels stamp in
		tuiWrap.animate(
			[
				{ opacity: 0, transform: "translateX(-12px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 260 },
		);
		browserWrap.animate(
			[
				{ opacity: 0, transform: "translateX(12px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...opts, duration: 260, delay: 100 },
		);

		// Type the prompt
		await ctx.hold(380);
		const promptStep = 1100 / USER_PROMPT_TEXT.length;
		for (let i = 0; i <= USER_PROMPT_TEXT.length; i++) {
			if (ctx.signal.aborted) return;
			userPrompt.textContent = USER_PROMPT_TEXT.slice(0, i);
			await ctx.hold(promptStep);
		}
		userCaret.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 100,
		});

		// Agent line
		await ctx.hold(120);
		agentLine.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 160,
		});
		const agentStep = 700 / AGENT_LINE.length;
		for (let i = 0; i <= AGENT_LINE.length; i++) {
			if (ctx.signal.aborted) return;
			agentText.textContent = AGENT_LINE.slice(0, i);
			await ctx.hold(agentStep);
		}

		// Spinner
		working.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 120,
		});
		const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
		const spinStep = 80;
		const spinIters = Math.floor(700 / spinStep);
		for (let i = 0; i < spinIters; i++) {
			if (ctx.signal.aborted) return;
			spinner.textContent = spinnerFrames[i % spinnerFrames.length];
			await ctx.hold(spinStep);
		}
		spinner.textContent = "";
		working.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 120,
		});

		// Done line
		await ctx.hold(120);
		agentDone.animate(
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 240 },
		);

		// HMR flash + crossfade
		hmrFlash.animate(
			[
				{ opacity: 0, transform: "scale(0.9)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...opts, duration: 180 },
		);
		beforeCard.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 200,
			delay: 80,
		});
		afterCard.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 200,
		});

		// Title card reveal (mirrors rs-title-card)
		await ctx.hold(280);
		acStar.animate(
			[
				{ opacity: 0, transform: "rotate(-12deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-12deg) scale(1)" },
			],
			{ ...opts, duration: 200 },
		);
		acKicker.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 180,
			delay: 140,
		});
		acTitle.animate(
			[
				{ opacity: 0, transform: "scale(0.92)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...opts, duration: 260, delay: 320 },
		);
		acRule.animate([{ width: "0px" }, { width: "640px" }], { ...opts, duration: 280, delay: 580 });
		acSub.animate(
			[
				{ opacity: 0, transform: "translateY(10px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 240, delay: 820 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
