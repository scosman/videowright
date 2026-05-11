import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "neon-terminal-sample-ui-showcase",
	advances: [2.5, 5.0],
	voiceover:
		"UI showcases in Neon Terminal. A full TUI mock with sidebar navigation, main plan pane, and memory panel on the right.",

	mount(el) {
		host = el;

		const menuItems = ["run", "memory", "plan", "tools", "trace", "eval"];
		const menuHtml = menuItems
			.map(
				(x, i) =>
					`<div style="
            padding: 6px 10px; font-size: 16px;
            ${i === 2 ? "color: var(--color-accent); text-shadow: var(--glow); background: rgba(74,222,128,0.08);" : "color: var(--color-muted);"}
          ">${i === 2 ? "▸ " : "  "}${x}</div>`,
			)
			.join("");

		const planItems = [
			{ status: "done", text: "Read eval spec" },
			{ status: "done", text: "Generate 12 candidate prompts" },
			{ status: "done", text: "Score each against rubric" },
			{ status: "··", text: "Select top-3 by F1" },
			{ status: "··", text: "Iterate with reasoning trace" },
			{ status: "··", text: "Submit batch to coordinator" },
		];
		const planHtml = planItems
			.map(
				(item, i) =>
					`<div style="display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--color-border);">
            <span style="min-width: 20px; color: var(--color-muted);">${String(i + 1).padStart(2, "0")}</span>
            <span style="flex: 1; font-size: 16px;">${item.text}</span>
            <span style="
              min-width: 60px; text-align: right;
              ${item.status === "done" ? "color: var(--color-accent); text-shadow: var(--glow);" : "color: var(--amber); text-shadow: 0 0 12px rgba(245,158,11,0.45);"}
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
            <span style="margin-left: 16px;">beacon@console:~$ tui --session=41ac</span>
            <span style="margin-left: auto; color: var(--color-accent); text-shadow: var(--glow);">[ live ]</span>
          </div>

          <div style="padding: 16px; overflow: hidden;">
            <div data-ref="tui" style="
              display: grid; grid-template-columns: 200px 1fr 240px;
              height: 720px; border: 1px solid var(--color-border);
              font-size: 16px; opacity: 0;
            ">
              <div style="padding: 16px; border-right: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 6px;">
                <div style="font-size: 12px; color: var(--color-muted); margin-bottom: 8px;">── MENU ──</div>
                ${menuHtml}
                <div style="margin-top: auto; color: var(--color-muted);">── status ──</div>
                <div style="color: var(--color-accent); text-shadow: var(--glow); font-size: 14px;">● running 00:14:22</div>
              </div>

              <div style="padding: 20px;">
                <div style="font-size: 14px; color: var(--color-muted);">── PLAN · v3 ────────────────────────────</div>
                ${planHtml}
              </div>

              <div style="padding: 16px; border-left: 1px solid var(--color-border);">
                <div style="font-size: 14px; color: var(--color-muted); margin-bottom: 12px;">── MEMORY ──</div>
                <pre style="font-size: 14px; margin: 0; line-height: 1.7; color: var(--color-muted);">t=00:02 ✓ snap_001
t=00:05 ✓ snap_002
t=00:09 ✓ snap_003</pre>
                <pre style="font-size: 14px; margin: 0; line-height: 1.7; color: var(--color-accent); text-shadow: var(--glow);">t=00:14 ● snap_004</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const tui = host?.querySelector('[data-ref="tui"]') as HTMLElement;

		tui.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 250,
			easing: "steps(8, end)",
			fill: "forwards",
		});

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
