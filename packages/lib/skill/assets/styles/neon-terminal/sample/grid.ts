import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-grid",
	advances: [2.5, 5.0],
	voiceover:
		"Card grids in Neon Terminal. Three terminal panes side by side, each its own mini-terminal with a prompt and content.",

	mount(el) {
		host = el;

		const cards = [
			{
				n: "01",
				name: "memory",
				cmd: "memory.snap()",
				desc: "Persistent state across long sessions.",
			},
			{
				n: "02",
				name: "reasoning",
				cmd: "plan.revise()",
				desc: "Plans that adapt to fresh evidence.",
			},
			{
				n: "03",
				name: "recovery",
				cmd: "rewind.to(t)",
				desc: "Rewind to a last-known-good moment.",
			},
		];

		const panes = cards
			.map(
				(c, i) => `
          <div data-ref="pane${i}" style="
            border: 1px solid var(--color-border);
            padding: 24px;
            min-height: 340px;
            background: rgba(74,222,128,0.03);
            opacity: 0;
          ">
            <div style="color: var(--color-accent); text-shadow: var(--glow); font-size: 14px; margin-bottom: 20px;">[${c.n}/03]</div>
            <div style="font-size: 48px; font-weight: 500; margin-bottom: 18px;">${c.name}</div>
            <div style="font-size: 17px; color: var(--color-muted); line-height: 1.5; margin-bottom: 28px;">${c.desc}</div>
            <div style="border-top: 1px solid var(--color-border); padding-top: 18px;">
              <span style="color: var(--color-accent); text-shadow: var(--glow);">$</span> <span style="font-size: 17px;">${c.cmd}</span>
            </div>
          </div>`,
			)
			.join("");

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
            <span style="margin-left: 16px;">beacon@console:~$ architecture --primitives</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ 3 panes ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="prompt" style="font-size: 18px; color: var(--color-muted); opacity: 0;">
              $ arch.primitives()
            </div>

            <div style="margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;">
              ${panes}
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

		for (let i = 0; i < 3; i++) {
			const pane = host?.querySelector(`[data-ref="pane${i}"]`) as HTMLElement;
			pane.animate([{ opacity: 0 }, { opacity: 1 }], {
				...opts,
				duration: 250,
				delay: 400 + i * 200,
			});
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
