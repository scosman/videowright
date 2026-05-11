import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-bullet",
	advances: [2.5, 5.0],
	voiceover:
		"Bullet reveals in Neon Terminal. Numbered rows with status badges, each appearing in a stepped stagger.",

	mount(el) {
		host = el;

		const items = [
			{ n: "01", text: "Context windows decay.", status: "OK" },
			{ n: "02", text: "Tool selection drifts.", status: "OK" },
			{ n: "03", text: "Plans go stale.", status: "··" },
			{ n: "04", text: "Errors compound.", status: "··" },
			{ n: "05", text: "Recovery requires restart.", status: "!!" },
		];

		const rows = items
			.map(
				(item, i) => `
          <div data-ref="row${i}" style="
            display: flex; align-items: center; gap: 24px;
            padding: 14px 0;
            border-bottom: 1px solid var(--color-border);
            opacity: 0;
          ">
            <span style="color: var(--color-accent); text-shadow: var(--glow); min-width: 40px;">[${item.n}]</span>
            <span style="flex: 1; font-size: 28px;">${item.text}</span>
            <span style="
              min-width: 60px; text-align: right;
              ${item.status === "OK" ? "color: var(--color-accent); text-shadow: var(--glow);" : item.status === "!!" ? "color: var(--amber); text-shadow: 0 0 12px rgba(245,158,11,0.45);" : "color: var(--color-muted);"}
            ">[${item.status}]</span>
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
            <span style="margin-left: 16px;">beacon@console:~$ failures --list</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ 5 findings ]</span>
          </div>

          <div style="padding: 48px 56px; overflow: hidden;">
            <div data-ref="prompt" style="font-size: 22px; color: var(--color-muted); opacity: 0;">
              $ failures list --top=5
            </div>
            <div style="margin-top: 36px;">
              ${rows}
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

		for (let i = 0; i < 5; i++) {
			const row = host?.querySelector(`[data-ref="row${i}"]`) as HTMLElement;
			row.animate([{ opacity: 0 }, { opacity: 1 }], {
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
