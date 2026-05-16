import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const CLAUDE_ORANGE = "#d97757";

// User-provided ASCII mascot (same as cold-open)
const MASCOT = `  ▐▛███▜▌
 ▝▜█████▛▘
   ▘▘ ▝▝`;

const USER_PROMPT = "update the title card to our latest branding and style";
const AGENT_LINE_1 = "Updating segments/title-card.tsx, styles/tokens.css…";
const AGENT_LINE_2 = "Done. Hot-reloaded.";

export default defineSegment({
	id: "interactive-dev",
	// Two advances: first lands after VO says "hot reloads" (~4.0s in), second
	// is segment end after a long hold (~3s) so viewers SEE the hot reload.
	advances: [4.0, 7.5],
	voiceover: "Request changes in your coding agent, and the preview hot reloads.",

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

        <!-- Split screen layout -->
        <div style="
          position: absolute;
          left: var(--safe-x); right: var(--safe-x);
          top: var(--safe-y); bottom: 100px;
          display: grid;
          grid-template-columns: 40fr 60fr;
          gap: 32px;
        ">
          <!-- LEFT: Claude Code terminal -->
          <div style="
            background: #0c0c0c;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            display: flex; flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          ">
            <!-- Terminal chrome -->
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
                font-family: var(--font-mono); font-size: 14px;
                color: #999;
              ">~/projects/videowright-demo — claude</div>
            </div>

            <!-- Claude Code body -->
            <div style="
              flex: 1;
              display: flex; flex-direction: column;
              padding: 22px 26px 20px;
              font-family: var(--font-mono);
              color: #e5e5e5;
              background: #0c0c0c;
              overflow: hidden;
            ">
              <!-- Banner -->
              <div style="
                display: flex; align-items: flex-start; gap: 16px;
                padding-bottom: 16px;
                border-bottom: 1px dashed #2a2a2a;
                margin-bottom: 22px;
              ">
                <pre style="
                  margin: 0;
                  font-family: var(--font-mono);
                  font-size: 16px;
                  line-height: 1.05;
                  color: ${CLAUDE_ORANGE};
                  text-shadow: 0 0 8px rgba(217, 119, 87, 0.35);
                ">${MASCOT}</pre>
                <div style="display: flex; flex-direction: column; gap: 2px; padding-top: 4px;">
                  <div style="
                    font-family: var(--font-mono);
                    font-size: 18px;
                    color: ${CLAUDE_ORANGE};
                    font-weight: 500;
                  ">✻ Claude Code</div>
                  <div style="
                    font-family: var(--font-mono);
                    font-size: 14px;
                    color: #888;
                  ">cwd: ~/projects/videowright-demo</div>
                </div>
              </div>

              <!-- Conversation log -->
              <div style="
                flex: 1;
                font-size: 18px;
                line-height: 1.6;
                overflow: hidden;
              ">
                <div data-ref="user-block" style="opacity: 0;">
                  <div style="color: #888;">
                    <span style="color: ${CLAUDE_ORANGE};">&gt;</span>
                    <span data-ref="user-prompt" style="color: #e5e5e5;"></span><span data-ref="user-caret" style="
                      display: inline-block; width: 8px; height: 18px;
                      background: ${CLAUDE_ORANGE};
                      margin-left: 2px; vertical-align: middle;
                      animation: blink 1s steps(2) infinite;
                    "></span>
                  </div>
                </div>

                <div data-ref="agent-block-1" style="margin-top: 20px; opacity: 0;">
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span style="color: ${CLAUDE_ORANGE}; flex-shrink: 0;">●</span>
                    <div style="flex: 1;">
                      <span data-ref="agent-text-1" style="color: #e5e5e5;"></span>
                    </div>
                  </div>
                  <div data-ref="working" style="
                    margin-top: 8px;
                    padding-left: 22px;
                    display: flex; align-items: center; gap: 10px;
                    font-size: 15px;
                    color: ${CLAUDE_ORANGE};
                    opacity: 0;
                  ">
                    <span data-ref="spinner" style="display: inline-block; width: 1ch;"></span>
                    <span style="color: #ccc;">writing edits…</span>
                  </div>
                </div>

                <div data-ref="agent-block-2" style="margin-top: 22px; opacity: 0;">
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <span style="color: ${CLAUDE_ORANGE}; flex-shrink: 0;">●</span>
                    <div style="flex: 1;">
                      <span style="color: #9fc77a;">✓</span>
                      <span style="color: #e5e5e5;"> ${AGENT_LINE_2}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer status -->
              <div style="
                margin-top: 12px;
                display: flex; gap: 16px;
                font-family: var(--font-mono);
                font-size: 12px;
                color: #666;
              ">
                <span><span style="color: ${CLAUDE_ORANGE};">●</span> claude-opus-4-7</span>
                <span>vite hmr · ready</span>
              </div>
              <style>@keyframes blink { 50% { opacity: 0; } }</style>
            </div>
          </div>

          <!-- RIGHT: Browser running dev server -->
          <div style="
            background: #0a0f14;
            border: 1px solid var(--color-border);
            border-radius: 6px;
            display: flex; flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          ">
            <!-- Browser chrome -->
            <div style="
              display: flex; align-items: center; gap: 10px;
              padding: 10px 14px;
              background: #131c25;
              border-bottom: 1px solid var(--color-border);
            ">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f57;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #febc2e;"></div>
              <div style="width: 12px; height: 12px; border-radius: 50%; background: #28c840;"></div>

              <!-- Back/forward arrows -->
              <div style="display: flex; gap: 6px; margin-left: 12px; color: var(--color-muted);">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M9 2 L4 7 L9 12" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.4;">
                  <path d="M5 2 L10 7 L5 12" />
                </svg>
              </div>

              <!-- URL bar -->
              <div style="
                flex: 1;
                margin-left: 14px;
                padding: 6px 14px;
                background: var(--color-bg);
                border: 1px solid var(--color-border);
                border-radius: 14px;
                font-family: var(--font-mono);
                font-size: 13px;
                color: var(--color-muted);
                display: flex; align-items: center; gap: 8px;
              ">
                <span style="color: var(--cyan);">●</span>
                <span>localhost:5173</span>
                <span style="margin-left: auto; color: var(--color-accent); font-size: 10px; letter-spacing: 0.12em;">HMR</span>
              </div>
            </div>

            <!-- Video stage (title card rendering live) -->
            <div data-ref="browser-stage" style="
              flex: 1;
              position: relative;
              overflow: hidden;
              background: #000;
            ">
              <!-- BEFORE: basic, off-brand title card (initial state) -->
              <div data-ref="basic-card" style="
                position: absolute; inset: 0;
                background: #14171c;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
              ">
                <div style="
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 86px;
                  font-weight: 400;
                  letter-spacing: -0.01em;
                  color: #d0d4dc;
                  margin-bottom: 14px;
                ">VideoRight</div>
                <div style="
                  font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 22px;
                  font-weight: 400;
                  letter-spacing: 0.02em;
                  color: #7a818c;
                ">Video Agent Tool</div>
              </div>

              <!-- AFTER: real motion-engineering title card (hidden initially) -->
              <div data-ref="me-card" style="
                position: absolute; inset: 0;
                background: var(--color-bg);
                opacity: 0;
              ">
                <div style="
                  position: absolute; inset: 0; pointer-events: none;
                  background:
                    linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 48px 48px,
                    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 48px 48px;
                "></div>

                <div data-ref="me-tag" style="
                  position: absolute;
                  left: 50%; top: 42%;
                  transform: translate(-50%, calc(-50% + 6px));
                  font-family: var(--font-mono);
                  font-size: 11px;
                  letter-spacing: 0.3em;
                  color: var(--color-accent);
                  opacity: 0;
                ">&#9698; PRODUCT &middot; 001</div>

                <div data-ref="me-title" style="
                  position: absolute;
                  left: 50%; top: 50%;
                  transform: translate(-50%, calc(-50% + 16px));
                  font-family: var(--font-display);
                  font-size: 110px;
                  font-weight: 500;
                  letter-spacing: -0.02em;
                  line-height: 1;
                  color: var(--color-fg);
                  opacity: 0;
                ">Videowright</div>

                <svg style="
                  position: absolute;
                  left: 50%; top: calc(50% + 70px);
                  transform: translate(-50%, 0);
                  overflow: visible;
                " width="500" height="20">
                  <line data-ref="me-dim-main" x1="0" y1="10" x2="500" y2="10"
                    stroke="var(--cyan)" stroke-width="1.5"
                    style="transform-origin: 250px 10px; transform: scaleX(0);" />
                  <line data-ref="me-dim-l" x1="0" y1="4" x2="0" y2="16"
                    stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
                  <line data-ref="me-dim-r" x1="500" y1="4" x2="500" y2="16"
                    stroke="var(--cyan)" stroke-width="1.5" style="opacity: 0;" />
                </svg>

                <div data-ref="me-subtitle" style="
                  position: absolute;
                  left: 50%; top: calc(50% + 108px);
                  transform: translate(-50%, 6px);
                  font-family: var(--font-display);
                  font-size: 26px;
                  font-weight: 400;
                  color: var(--color-muted);
                  opacity: 0;
                ">Build videos in Claude Code</div>
              </div>

              <!-- HMR flash indicator -->
              <div data-ref="hmr-flash" style="
                position: absolute;
                top: 16px; right: 20px;
                font-family: var(--font-mono);
                font-size: 11px;
                letter-spacing: 0.15em;
                color: var(--color-accent);
                opacity: 0;
                display: flex; align-items: center; gap: 6px;
                z-index: 2;
              ">
                <span style="
                  display: inline-block; width: 6px; height: 6px;
                  background: var(--color-accent); border-radius: 50%;
                  box-shadow: 0 0 8px var(--color-accent);
                "></span>
                <span>HOT RELOADED</span>
              </div>
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
          <span>BEAT 04C</span>
          <span>INTERACTIVE DEV LOOP</span>
          <span style="margin-left: auto;">HMR ✓</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const userBlock = host?.querySelector('[data-ref="user-block"]') as HTMLElement;
		const userPrompt = host?.querySelector('[data-ref="user-prompt"]') as HTMLElement;
		const userCaret = host?.querySelector('[data-ref="user-caret"]') as HTMLElement;
		const agentBlock1 = host?.querySelector('[data-ref="agent-block-1"]') as HTMLElement;
		const agentText1 = host?.querySelector('[data-ref="agent-text-1"]') as HTMLElement;
		const agentBlock2 = host?.querySelector('[data-ref="agent-block-2"]') as HTMLElement;
		const working = host?.querySelector('[data-ref="working"]') as HTMLElement;
		const spinner = host?.querySelector('[data-ref="spinner"]') as HTMLElement;
		const hmrFlash = host?.querySelector('[data-ref="hmr-flash"]') as HTMLElement;

		// Browser stage refs
		const basicCard = host?.querySelector('[data-ref="basic-card"]') as HTMLElement;
		const meCard = host?.querySelector('[data-ref="me-card"]') as HTMLElement;
		const meTag = host?.querySelector('[data-ref="me-tag"]') as HTMLElement;
		const meTitle = host?.querySelector('[data-ref="me-title"]') as HTMLElement;
		const meDimMain = host?.querySelector('[data-ref="me-dim-main"]') as SVGLineElement;
		const meDimL = host?.querySelector('[data-ref="me-dim-l"]') as SVGLineElement;
		const meDimR = host?.querySelector('[data-ref="me-dim-r"]') as SVGLineElement;
		const meSubtitle = host?.querySelector('[data-ref="me-subtitle"]') as HTMLElement;

		// Cursor blinks in input, prompt typing starts immediately
		userBlock.style.opacity = "1";

		// User prompt types in (longer prompt, snappy cadence)
		const prompt = USER_PROMPT;
		const typeStepMs = 1000 / prompt.length;
		for (let i = 0; i <= prompt.length; i++) {
			if (ctx.signal.aborted) return;
			userPrompt.textContent = prompt.slice(0, i);
			await ctx.hold(typeStepMs);
		}
		userCaret.style.display = "none";

		// 0:04–0:06 — agent response streams in + spinner
		agentBlock1.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});
		const line1 = AGENT_LINE_1;
		const lineStepMs = 300 / line1.length;
		for (let i = 0; i <= line1.length; i++) {
			if (ctx.signal.aborted) return;
			agentText1.textContent = line1.slice(0, i);
			await ctx.hold(lineStepMs);
		}

		working.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
		});
		const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
		const totalSpinMs = 400;
		const spinStep = 80;
		const spinIters = Math.floor(totalSpinMs / spinStep);
		for (let i = 0; i < spinIters; i++) {
			if (ctx.signal.aborted) return;
			spinner.textContent = spinnerFrames[i % spinnerFrames.length];
			await ctx.hold(spinStep);
		}
		spinner.textContent = "";
		working.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 200,
		});

		// "Done. Hot-reloaded."
		await ctx.hold(100);
		agentBlock2.animate(
			[
				{ opacity: 0, transform: "translateY(6px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300 },
		);

		// GATE: wait for VO to land "hot reloads" before triggering the swap.
		// This sync makes the visual hot-reload land *after* the audible cue,
		// not before. After the swap, the segment holds for ~3s on the result.
		await ctx.waitForNext();

		// Hot-reload moment — browser swaps from basic VideoRight card → real
		// motion-engineering Videowright title card, with the same WAAPI motion
		// sequence as the title-card segment.
		hmrFlash.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
		});
		basicCard.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 280,
		});
		meCard.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 280,
			delay: 120,
		});

		// Wait for the ME background to come in, then trigger the title-card
		// reveal animations on its elements (mirrors segments/title-card).
		await ctx.hold(250);

		meTag.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 6px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 360 },
		);
		meTitle.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 16px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 500, delay: 180 },
		);
		meDimMain.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...opts,
			duration: 600,
			delay: 620,
		});
		meDimL.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 620,
		});
		meDimR.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 200,
			delay: 1120,
		});
		meSubtitle.animate(
			[
				{ opacity: 0, transform: "translate(-50%, 6px)" },
				{ opacity: 1, transform: "translate(-50%, 0)" },
			],
			{ ...opts, duration: 360, delay: 820 },
		);

		// Fade HMR badge and hold
		hmrFlash.animate([{ opacity: 1 }, { opacity: 0 }], {
			...opts,
			duration: 300,
			delay: 800,
		});

		// Long hold on the finished title card so the viewer registers the
		// hot-reload result. Then waitForNext lands us at segment end.
		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
