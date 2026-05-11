import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-title",
	advances: [2.5, 5.0],
	voiceover:
		"Title cards in Neon Terminal. A boot sequence types in, then an ASCII logo block and tagline appear stepped.",

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
            <span style="margin-left: 16px;">beacon@console:~$</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ booting ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden; position: relative;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ beacon --launch
            </div>

            <div data-ref="init" style="font-size: 22px; color: var(--color-muted); margin-top: 8px; opacity: 0;">
              loaded 12 modules in 240ms
            </div>

            <pre data-ref="logo" style="
              font-size: 72px; line-height: 1.1; font-weight: 500;
              margin: 40px 0 24px; white-space: pre;
              color: var(--color-accent); text-shadow: var(--glow);
              opacity: 0;
            ">  ____  ___    ___    ___ ___  _  _
 | __ )| __|  / __|  / __/ _ \\| \\| |
 | _ \\| _|  | (__  | (_| (_) | .  |
 |___/|___|  \\___|  \\___\\___/|_|\\_|</pre>

            <div data-ref="tagline" style="font-size: 28px; font-weight: 500; margin-top: 28px; opacity: 0;">
              // long-running agents for research labs<span style="
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
		const init = host?.querySelector('[data-ref="init"]') as HTMLElement;
		const logo = host?.querySelector('[data-ref="logo"]') as HTMLElement;
		const tagline = host?.querySelector('[data-ref="tagline"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		prompt.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		init.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 400,
		});

		logo.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 800,
		});

		tagline.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 1200,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
