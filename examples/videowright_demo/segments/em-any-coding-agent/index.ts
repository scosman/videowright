import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const CLAUDE_ORANGE = "#d97757";

export default defineSegment({
	id: "em-any-coding-agent",
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
          <div data-ref="tag" style="opacity: 0;">Chapter 03 / Compatibility</div>
          <div data-ref="tag-r" style="opacity: 0;">Plate VII</div>
        </div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: 220px;
          font-family: var(--font-display);
          font-size: 96px;
          line-height: 0.98;
          opacity: 0;
        ">Works in any coding agent<span style="color: var(--color-accent); font-style: italic;">.</span></div>

        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: 420px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1px;
          background: var(--color-border);
        ">
          ${card(0, "Claude Code", "Anthropic", claudeLogo(), "claude")}
          ${card(1, "Codex", "OpenAI", codexLogo(), "codex")}
          ${card(2, "opencode", "sst", opencodeLogo(), "opencode")}
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const $ = (k: string) => host?.querySelector(`[data-ref="${k}"]`) as HTMLElement;
		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const fwd = { fill: "forwards" as const, easing: ease };

		$("tag").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 480 });
		$("tag-r").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 480, delay: 80 });

		$("headline").animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 700, delay: 200 },
		);

		// stagger cards
		for (let i = 0; i < 3; i++) {
			const c = $(`card-${i}`);
			c.animate(
				[
					{ opacity: 0, transform: "translateY(20px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...fwd, duration: 600, delay: 800 + i * 220 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});

function card(idx: number, name: string, org: string, logoHTML: string, slug: string): string {
	void slug;
	return `
    <div data-ref="card-${idx}" style="
      background: var(--color-bg);
      padding: 56px 56px 64px;
      min-height: 460px;
      display: flex;
      flex-direction: column;
      gap: 28px;
      opacity: 0;
    ">
      <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-accent);">${String(idx + 1).padStart(2, "0")}</div>
      <div style="
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 160px;
      ">${logoHTML}</div>
      <div>
        <div style="font-family: var(--font-display); font-size: 56px; line-height: 1;">${name}</div>
        <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-muted); margin-top: 10px;">${org}</div>
      </div>
      <div style="font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-fg); border-top: 1px solid var(--color-border); padding-top: 14px;">Supported ✓</div>
    </div>
  `;
}

function claudeLogo(): string {
	// stylized sunburst-mark (simplified). 8 spokes with thick orange strokes.
	const spokes: string[] = [];
	for (let i = 0; i < 8; i++) {
		const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
		const x1 = 80 + Math.cos(a) * 24;
		const y1 = 80 + Math.sin(a) * 24;
		const x2 = 80 + Math.cos(a) * 64;
		const y2 = 80 + Math.sin(a) * 64;
		spokes.push(
			`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${CLAUDE_ORANGE}" stroke-width="14" stroke-linecap="round"/>`,
		);
	}
	return `
    <svg viewBox="0 0 160 160" style="width: 130px; height: 130px;">
      ${spokes.join("")}
      <circle cx="80" cy="80" r="14" fill="${CLAUDE_ORANGE}"/>
    </svg>
  `;
}

function codexLogo(): string {
	// spirograph-style mark — overlapping rotated rounded squares
	const rotations = [0, 30, 60, 90, 120, 150];
	const shapes = rotations
		.map(
			(r) =>
				`<rect x="20" y="20" width="120" height="120" rx="60" fill="none" stroke="var(--color-fg)" stroke-width="2" transform="rotate(${r} 80 80)"/>`,
		)
		.join("");
	return `
    <svg viewBox="0 0 160 160" style="width: 130px; height: 130px;">${shapes}</svg>
  `;
}

function opencodeLogo(): string {
	// two-tone square mark — outer square with inner offset square
	return `
    <svg viewBox="0 0 160 160" style="width: 130px; height: 130px;">
      <rect x="20" y="20" width="120" height="120" fill="var(--color-fg)"/>
      <rect x="48" y="48" width="80" height="80" fill="var(--color-accent)"/>
      <rect x="76" y="76" width="32" height="32" fill="var(--color-bg)"/>
    </svg>
  `;
}
