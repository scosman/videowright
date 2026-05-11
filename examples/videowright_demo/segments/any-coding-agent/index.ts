import { defineSegment } from "videowright";
import claudeSvg from "./icons/claude.svg?raw";
import codexSvg from "./icons/codex.svg?raw";
import opencodeSvg from "./icons/opencode.svg?raw";

let host: HTMLElement | null = null;

const CLAUDE_ORANGE = "#d97757";

function agentCard(name: string, iconSvg: string, iconColor: string): string {
	return `
    <div data-agent style="
      display: flex; flex-direction: column;
      align-items: center; gap: 28px;
      padding: 56px 48px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      min-width: 380px;
      position: relative;
      opacity: 0;
      transform: translateY(16px);
    " class="vw-agent-card">
      <!-- corner ticks (motion-engineering style) -->
      <div style="position: absolute; left: -1px; top: -1px; width: 14px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: -1px; top: -1px; width: 1.5px; height: 14px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: -1px; top: -1px; width: 14px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: -1px; top: -1px; width: 1.5px; height: 14px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: -1px; bottom: -1px; width: 14px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: -1px; bottom: -1px; width: 1.5px; height: 14px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: -1px; bottom: -1px; width: 14px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: -1px; bottom: -1px; width: 1.5px; height: 14px; background: var(--color-accent);"></div>

      <div data-agent-icon style="
        width: 160px; height: 160px;
        display: flex; align-items: center; justify-content: center;
        color: ${iconColor};
      ">${iconSvg}</div>

      <div style="
        font-family: var(--font-display);
        font-size: 36px;
        font-weight: 500;
        letter-spacing: -0.01em;
      ">${name}</div>

      <div style="
        font-family: var(--font-mono);
        font-size: 16px;
        letter-spacing: 0.18em;
        color: var(--color-muted);
      ">SUPPORTED ✓</div>
    </div>
  `;
}

export default defineSegment({
	id: "any-coding-agent",
	advances: [7.0],
	voiceover: "And Videowright works in every major coding agent.",

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

        <style>
          [data-agent-icon] svg {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>

        <div data-ref="tag" style="
          position: absolute;
          left: 50%; top: 16%;
          transform: translate(-50%, -50%);
          font-family: var(--font-mono);
          font-size: 18px;
          letter-spacing: 0.3em;
          color: var(--color-accent);
          opacity: 0;
        ">&#9698; COMPATIBILITY</div>

        <div data-ref="title" style="
          position: absolute;
          left: 50%; top: 24%;
          transform: translate(-50%, -50%);
          font-family: var(--font-display);
          font-size: 84px;
          font-weight: 500;
          letter-spacing: -0.01em;
          text-align: center;
          white-space: nowrap;
          opacity: 0;
        ">Works in any coding agent.</div>

        <div style="
          position: absolute;
          left: 50%; top: 58%;
          transform: translate(-50%, -50%);
          display: flex; gap: 64px;
        ">
          ${agentCard("Claude Code", claudeSvg, CLAUDE_ORANGE)}
          ${agentCard("Codex", codexSvg, "var(--color-fg)")}
          ${agentCard("opencode", opencodeSvg, "var(--color-fg)")}
        </div>

        <div style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        ">
          <span>BEAT 05</span>
          <span>AGENT MATRIX</span>
          <span style="margin-left: auto;">3 / 3</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const tag = host?.querySelector('[data-ref="tag"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const cards = host?.querySelectorAll("[data-agent]");

		tag.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 6px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 360 },
		);
		title.animate(
			[
				{ opacity: 0, transform: "translate(-50%, calc(-50% + 12px))" },
				{ opacity: 1, transform: "translate(-50%, -50%)" },
			],
			{ ...opts, duration: 500, delay: 200 },
		);

		cards?.forEach((c, i) => {
			(c as HTMLElement).animate(
				[
					{ opacity: 0, transform: "translateY(16px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 500, delay: 700 + i * 500 },
			);
		});

		await ctx.hold(7000);
	},

	unmount() {
		host = null;
	},
});
