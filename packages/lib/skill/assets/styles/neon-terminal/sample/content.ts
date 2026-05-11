import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-content",
	advances: [2.5, 5.0],
	voiceover:
		"Content cards in Neon Terminal. A manifesto-style block of text with quote prefixes, typed in with stepped reveals.",

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
            <span style="margin-left: 16px;">beacon@console:~$ cat ./manifesto.txt</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ memo ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden; max-width: 1500px;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ cat ./manifesto.txt
            </div>

            <div data-ref="heading" style="font-size: 72px; font-weight: 500; margin-top: 36px; margin-bottom: 32px; opacity: 0;">
              // what we believe
            </div>

            <div data-ref="quote" style="font-size: 24px; line-height: 1.6; margin-bottom: 24px; opacity: 0;">
              <span style="color: var(--color-accent); text-shadow: var(--glow);">&gt; </span>The next decade of AI infrastructure will be built around <span style="color: var(--color-accent); text-shadow: var(--glow);">long</span> runs — agents that work for hours, not seconds.
            </div>

            <div data-ref="body" style="font-size: 22px; line-height: 1.6; color: var(--color-muted); opacity: 0;">
              The bottleneck won't be the model. It will be everything around the model: memory, recovery, observability. The unglamorous parts. The parts we are building.
            </div>

            <div data-ref="sig" style="font-size: 22px; color: var(--color-muted); margin-top: 32px; opacity: 0;">
              ── beacon team · 2026.05
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const prompt = host?.querySelector('[data-ref="prompt"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const quote = host?.querySelector('[data-ref="quote"]') as HTMLElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;
		const sig = host?.querySelector('[data-ref="sig"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		prompt.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		heading.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 400,
		});

		quote.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 700,
		});

		body.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 1000,
		});

		sig.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 1300,
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
