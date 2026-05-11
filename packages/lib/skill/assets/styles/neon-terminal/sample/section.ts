import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-section",
	advances: [2.0, 4.5],
	voiceover:
		"Section headers in Neon Terminal. An ASCII rule types across, then the chapter name appears in large mono below.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-mono);
        overflow: hidden;
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(74, 222, 128, 0.04) 3px 4px);
        "></div>

        <div style="
          position: absolute;
          inset: var(--safe-y) var(--safe-x);
          border: 1px solid var(--color-border);
          background: rgba(10,14,11,0.6);
        ">
          <div style="
            display: flex; align-items: center;
            padding: 14px 20px;
            border-bottom: 1px solid var(--color-border);
            gap: 12px; font-size: 14px; color: var(--color-muted);
          ">
            <span style="width: 10px; height: 10px; border-radius: 5px; background: var(--color-border);"></span>
            <span style="width: 10px; height: 10px; border-radius: 5px; background: var(--color-border);"></span>
            <span style="width: 10px; height: 10px; border-radius: 5px; background: var(--color-border);"></span>
            <span style="margin-left: 16px;">beacon@console:~$ section --part=02</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ chapter ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="rule" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              ── chapter 02 ────────────────────────────────────────────
            </div>

            <div data-ref="heading" style="
              font-size: 160px; font-weight: 500; line-height: 1.0;
              margin-top: 60px; opacity: 0;
            "><span style="color: var(--color-accent); text-shadow: var(--glow);">$</span> the architecture</div>

            <div data-ref="sub" style="font-size: 22px; color: var(--color-muted); margin-top: 60px; opacity: 0;">
              ── 3 primitives · memory · reasoning · recovery ──────────
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const rule = host?.querySelector('[data-ref="rule"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const sub = host?.querySelector('[data-ref="sub"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		rule.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		heading.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 400,
		});

		sub.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 800,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
