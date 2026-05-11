import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-cta",
	advances: [2.0, 4.5],
	voiceover:
		"CTA cards in Neon Terminal. An install command types in, then the glowing headline and URL appear stepped.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <style>
        @keyframes nt-blink { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
      </style>
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
            <span style="margin-left: 16px;">beacon@console:~$ install</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ ready ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ curl -sSL beacon.run/install | sh
            </div>

            <div data-ref="headline" style="
              font-size: 140px; font-weight: 500; line-height: 1.0;
              margin-top: 56px;
              color: var(--color-accent); text-shadow: var(--glow);
              opacity: 0;
            ">$ install beacon</div>

            <div data-ref="links" style="font-size: 24px; color: var(--color-muted); margin-top: 36px; opacity: 0;">
              → beacon.run · docs · github.com/beacon-ai
            </div>

            <div data-ref="mark" style="
              margin-top: 60px; display: flex; align-items: center; gap: 12px; opacity: 0;
            ">
              <div style="
                width: 22px; height: 22px; border: 1.5px solid var(--color-fg); position: relative;
              ">
                <div style="
                  position: absolute; inset: 5px;
                  background: var(--color-accent);
                  box-shadow: 0 0 12px rgba(74,222,128,0.7);
                "></div>
              </div>
              <span style="font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-muted);">BEACON · 2026</span>
              <span style="
                display: inline-block; width: 0.6em; height: 1em;
                background: var(--color-accent);
                box-shadow: 0 0 12px rgba(74,222,128,0.7);
                vertical-align: text-bottom;
                animation: nt-blink 1s steps(2, end) infinite;
                margin-left: 4px;
              "></span>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const prompt = host?.querySelector('[data-ref="prompt"]') as HTMLElement;
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const links = host?.querySelector('[data-ref="links"]') as HTMLElement;
		const mark = host?.querySelector('[data-ref="mark"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		prompt.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		headline.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 500,
		});

		links.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 800,
		});

		mark.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 1100,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
