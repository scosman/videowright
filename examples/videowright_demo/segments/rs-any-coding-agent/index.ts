import { defineSegment } from "videowright";
import claudeSvg from "../any-coding-agent/icons/claude.svg?raw";
import codexSvg from "../any-coding-agent/icons/codex.svg?raw";
import opencodeSvg from "../any-coding-agent/icons/opencode.svg?raw";

let host: HTMLElement | null = null;

const CLAUDE_ORANGE = "#d97757";

const GRAIN_BG = `url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;)`;

function agentCard(name: string, iconSvg: string, iconColor: string, tilt: number): string {
	return `
    <div data-agent style="
      display: flex; flex-direction: column;
      align-items: center; gap: 24px;
      padding: 48px 36px;
      border: 3px solid var(--color-fg);
      background: var(--color-bg);
      min-width: 320px;
      max-width: 360px;
      position: relative;
      opacity: 0;
      transform: translateY(16px) rotate(${tilt}deg);
      box-shadow: 4px 4px 0 0 var(--color-accent);
    ">
      <div data-agent-icon style="
        width: 160px; height: 160px;
        display: flex; align-items: center; justify-content: center;
        color: ${iconColor};
      ">${iconSvg}</div>

      <div style="
        font-family: var(--font-display);
        font-size: 36px;
        letter-spacing: -0.01em;
      ">${name}</div>

      <div style="
        font-family: var(--font-mono);
        font-size: 14px;
        letter-spacing: 0.18em;
        font-weight: 700;
        color: var(--color-fg);
        padding: 4px 10px;
        background: var(--color-second);
      ">SUPPORTED &#10003;</div>
    </div>
  `;
}

export default defineSegment({
	id: "rs-any-coding-agent",
	advances: [6.58],
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
          position: absolute; inset: 0; pointer-events: none; z-index: 30;
          background-image: ${GRAIN_BG};
          opacity: var(--grain-opacity); mix-blend-mode: multiply;
        "></div>

        <style>
          [data-agent-icon] svg {
            width: 100%;
            height: 100%;
            display: block;
          }
        </style>

        <div style="
          position: absolute;
          right: var(--safe-x); top: 60px;
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--color-accent);
          transform: rotate(-3deg);
        ">&#9733; 07/08 &#9733;</div>

        <div data-ref="tag" style="
          position: absolute;
          left: 50%; top: 130px;
          transform: translate(-50%, 0);
          font-family: var(--font-mono);
          font-size: 22px;
          letter-spacing: 0.3em;
          color: var(--color-accent);
          font-weight: 600;
          opacity: 0;
        ">&#9670; COMPATIBILITY &#9670;</div>

        <div data-ref="title" style="
          position: absolute;
          left: 50%; top: 220px;
          transform: translate(-50%, 0);
          font-family: var(--font-display);
          font-size: 96px;
          letter-spacing: -0.02em;
          text-align: center;
          white-space: nowrap;
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">works in any coding agent.</span>
            <span style="position: relative;">works in any coding agent.</span>
          </span>
        </div>

        <div style="
          position: absolute;
          left: 50%; top: 580px;
          transform: translate(-50%, 0);
          display: flex; gap: 52px;
        ">
          ${agentCard("Claude Code", claudeSvg, CLAUDE_ORANGE, -2)}
          ${agentCard("Codex", codexSvg, "var(--color-fg)", 1.5)}
          ${agentCard("opencode", opencodeSvg, "var(--color-fg)", -1)}
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const tag = host?.querySelector('[data-ref="tag"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const cards = host?.querySelectorAll("[data-agent]");

		const stepEase = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: stepEase };

		tag.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 220 });
		title.animate(
			[
				{ opacity: 0, transform: "translate(-50%, 8px)" },
				{ opacity: 1, transform: "translate(-50%, 0)" },
			],
			{ ...opts, duration: 320, delay: 220 },
		);

		const tilts = [-2, 1.5, -1];
		cards?.forEach((c, i) => {
			const tilt = tilts[i];
			(c as HTMLElement).animate(
				[
					{ opacity: 0, transform: `translateY(16px) rotate(${tilt}deg) scale(0.92)` },
					{ opacity: 1, transform: `translateY(0) rotate(${tilt}deg) scale(1)` },
				],
				{ ...opts, duration: 320, delay: 700 + i * 360 },
			);
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
