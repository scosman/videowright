import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-kinetic",
	advances: [2.5, 5.0],
	voiceover:
		"Kinetic statements in Neon Terminal. Words appear one at a time with stepped easing, the last word glows phosphor green.",

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
            <span style="margin-left: 16px;">beacon@console:~$ statement --id=03</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ premise ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ echo statement.03
            </div>

            <div style="
              font-size: 100px; font-weight: 500; line-height: 1.1;
              margin-top: 60px; max-width: 1500px;
            ">
              <span data-ref="w0" style="opacity: 0;">Most </span>
              <span data-ref="w1" style="opacity: 0;">agents </span>
              <span data-ref="w2" style="opacity: 0;">fail </span>
              <br />
              <span data-ref="w3" style="opacity: 0;">because </span>
              <span data-ref="w4" style="opacity: 0;">they </span>
              <span data-ref="w5" style="opacity: 0; color: var(--color-accent); text-shadow: var(--glow);">forget.<span style="
                display: inline-block; width: 0.6em; height: 1em;
                background: var(--color-accent);
                box-shadow: 0 0 12px rgba(74,222,128,0.7);
                vertical-align: text-bottom;
                animation: nt-blink 1s steps(2, end) infinite;
                margin-left: 4px;
              "></span></span>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const prompt = host?.querySelector('[data-ref="prompt"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		prompt.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		for (let i = 0; i < 6; i++) {
			const word = host?.querySelector(`[data-ref="w${i}"]`) as HTMLElement;
			word.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 200,
				delay: 400 + i * 160,
			});
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
