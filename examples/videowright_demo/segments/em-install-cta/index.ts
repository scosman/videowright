import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "em-install-cta",
	advances: [7.81],
	voiceover:
		"Paste one line into your coding agent. You'll have a video before your coffee's cold.",

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
          <div data-ref="tag" style="opacity: 0;">Chapter 04 / Install</div>
          <div data-ref="tag-r" style="opacity: 0;">Fin.</div>
        </div>

        <div style="
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 64px;
          padding: 0 var(--safe-x);
        ">
          <div data-ref="kicker" style="
            font-family: var(--font-mono);
            font-size: 16px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--color-muted);
            opacity: 0;
          ">— Install</div>

          <div data-ref="headline" style="
            font-family: var(--font-display);
            font-style: italic;
            font-size: 168px;
            line-height: 0.96;
            text-align: center;
            opacity: 0;
          ">Install Videowright<span style="color: var(--color-accent); font-style: italic;">.</span></div>

          <div data-ref="term" style="
            border-top: 1px solid var(--color-accent);
            border-bottom: 1px solid var(--color-accent);
            padding: 32px 64px;
            opacity: 0;
            display: flex;
            align-items: baseline;
            gap: 24px;
          ">
            <span style="font-family: var(--font-mono); font-size: 38px; color: var(--color-accent);">$</span>
            <span data-ref="cmd" style="font-family: var(--font-mono); font-size: 40px; color: var(--color-fg); letter-spacing: 0.01em;"></span>
            <span data-ref="caret" style="display: inline-block; width: 0.5em; height: 0.9em; background: var(--color-fg); vertical-align: -2px;"></span>
          </div>
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

		$("kicker").animate([{ opacity: 0 }, { opacity: 1 }], { ...fwd, duration: 480, delay: 200 });

		$("headline").animate(
			[
				{ opacity: 0, transform: "translateY(20px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 800, delay: 320 },
		);

		$("term").animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...fwd, duration: 600, delay: 900 },
		);

		// caret blink
		$("caret").animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 600,
			iterations: Number.POSITIVE_INFINITY,
			direction: "alternate",
			easing: "steps(1)",
		});

		await ctx.hold(1500);

		// type the command
		const cmd = $("cmd");
		await typeText(ctx, cmd, "npm install videowright", 70);

		// holds the rest of the segment via waitForNext
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
