import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-feature",
	advances: [2.5, 5.0],
	voiceover:
		"Feature cards in Neon Terminal. A CLI prompt types in, then the feature name and description appear below with a params box.",

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
            <span style="margin-left: 16px;">beacon@console:~$ feature describe</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ 01 of 03 ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ feature describe --name=checkpoint-memory
            </div>

            <div data-ref="name" style="
              font-size: 96px; font-weight: 500; margin-top: 48px; margin-bottom: 28px; opacity: 0;
            "><span style="color: var(--color-accent); text-shadow: var(--glow);">▸</span> checkpoint memory</div>

            <div data-ref="desc" style="
              font-size: 22px; color: var(--color-muted); max-width: 1400px;
              line-height: 1.5; margin-bottom: 36px; opacity: 0;
            ">Snapshots an agent's reasoning state at each tool boundary. When a plan goes stale, the agent rewinds — not to the start, but to the last point its model of the world was correct.</div>

            <pre data-ref="params" style="
              font-size: 18px; line-height: 1.6; color: var(--color-muted);
              margin: 0; opacity: 0;
            ">&#x256D;&#x2500; params &#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x256E;
&#x2502;  snapshots/min  :  120                   &#x2502;
&#x2502;  avg restore    :  9 ms                  &#x2502;
&#x2502;  retention      :  14 d                  &#x2502;
&#x2570;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x2500;&#x256F;</pre>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const prompt = host?.querySelector('[data-ref="prompt"]') as HTMLElement;
		const name = host?.querySelector('[data-ref="name"]') as HTMLElement;
		const desc = host?.querySelector('[data-ref="desc"]') as HTMLElement;
		const params = host?.querySelector('[data-ref="params"]') as HTMLElement;

		const ease = "steps(8, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		prompt.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
		});

		name.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 500,
		});

		desc.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 250,
			delay: 800,
		});

		params.animate([{ opacity: 0 }, { opacity: 1 }], {
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
