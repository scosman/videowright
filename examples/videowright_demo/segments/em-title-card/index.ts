import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "em-title-card",
	advances: [4.51],
	voiceover: "This is Videowright. A library for building videos in your coding agent.",

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
        <!-- top rule + folio row -->
        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: var(--safe-y);
          height: 1px;
          background: var(--color-border);
        "></div>
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
          <div data-ref="kicker" style="opacity: 0;">Vol. 01 / Product · 001</div>
          <div data-ref="kicker-r" style="opacity: 0;">2026</div>
        </div>

        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          top: 320px;
        ">
          <div data-ref="headline" style="
            font-family: var(--font-display);
            font-size: 220px;
            line-height: 0.92;
            letter-spacing: -0.012em;
            opacity: 0;
          ">Videowright<span style="color: var(--color-accent); font-style: italic;">.</span></div>

          <div data-ref="rule" style="
            margin-top: 56px;
            height: 3px;
            width: 0;
            background: var(--color-accent);
          "></div>

          <div data-ref="subtitle" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 56px;
            margin-top: 48px;
            line-height: 1.1;
            opacity: 0;
          ">Build videos in Claude Code.</div>
        </div>

        <div style="
          position: absolute;
          left: var(--safe-x);
          right: var(--safe-x);
          bottom: calc(var(--safe-y) - 22px);
          height: 1px;
          background: var(--color-border);
        "></div>
      </div>
    `;
	},

	async play(ctx) {
		const $ = (k: string) => host?.querySelector(`[data-ref="${k}"]`) as HTMLElement;
		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const fwd = { fill: "forwards" as const, easing: ease };

		$("kicker").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 480 });
		$("kicker-r").animate([{ opacity: 0 }, { opacity: 1 }], {
			...fwd,
			duration: 480,
			delay: 80,
		});

		$("headline").animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 700, delay: 420 },
		);

		$("rule").animate([{ width: "0px" }, { width: "780px" }], {
			...fwd,
			duration: 900,
			delay: 980,
		});

		$("subtitle").animate(
			[
				{ opacity: 0, transform: "translateY(14px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 700, delay: 1480 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
