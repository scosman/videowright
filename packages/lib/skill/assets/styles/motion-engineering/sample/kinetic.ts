import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

function cornerTicks() {
	return `
    <div style="position: absolute; left: -1px; top: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; left: 0; top: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: 0; top: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; right: -1px; top: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; right: 0; top: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: 0; top: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; left: -1px; bottom: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; left: 0; bottom: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; left: 0; bottom: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>
    <div style="position: absolute; right: -1px; bottom: -1px; width: 24px; height: 24px;">
      <div style="position: absolute; right: 0; bottom: 0; width: 24px; height: 1.5px; background: var(--color-accent);"></div>
      <div style="position: absolute; right: 0; bottom: 0; width: 1.5px; height: 24px; background: var(--color-accent);"></div>
    </div>`;
}

export default defineSegment({
	id: "motion-engineering-sample-kinetic",
	advances: [2.5, 5.0],
	voiceover:
		"Kinetic statements in Motion Engineering. Words reveal one by one, each bracketed with tick marks. The last word is boxed in amber.",

	mount(el) {
		host = el;

		const words = ["Most", "agents", "fail", "because", "they", "forget."];
		const wordHtml = words
			.map(
				(w, i) => `
        <span data-ref="word${i}" style="
          display: inline-block;
          position: relative;
          margin-right: 30px;
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 120px;
          line-height: 1.0;
          opacity: 0;
          ${i === words.length - 1 ? "color: var(--color-accent);" : ""}
        ">
          <span style="position: absolute; top: -14px; left: 0; right: 0; height: 1px; background: var(--color-muted);"></span>
          <span style="position: absolute; top: -14px; left: 0; width: 1px; height: 12px; background: var(--color-muted);"></span>
          <span style="position: absolute; top: -14px; right: 0; width: 1px; height: 12px; background: var(--color-muted);"></span>
          <span style="position: absolute; bottom: -14px; left: 0; right: 0; height: 1px; background: var(--color-muted);"></span>
          <span style="position: absolute; bottom: -14px; left: 0; width: 1px; height: 12px; background: var(--color-muted);"></span>
          <span style="position: absolute; bottom: -14px; right: 0; width: 1px; height: 12px; background: var(--color-muted);"></span>
          ${w}
          ${i === words.length - 1 ? '<span style="position: absolute; inset: -12px -8px; border: 1.5px solid var(--color-accent);"></span>' : ""}
        </span>`,
			)
			.join("");

		el.innerHTML = `
      <div style="
        position: relative;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
      ">
        <div style="
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div data-ref="frame" style="
          position: absolute;
          inset: var(--safe-y) var(--safe-x);
          border: 1px solid var(--color-border);
          opacity: 0;
        ">
          ${cornerTicks()}

          <div data-ref="tag" style="
            position: absolute; left: 80px; top: 100px;
            font-family: var(--font-mono);
            font-size: 14px; letter-spacing: 0.25em;
            color: var(--color-accent);
            opacity: 0;
          ">&#9698; DOCUMENT 03 &middot; PREMISE</div>

          <div style="position: absolute; left: 80px; top: 240px; width: 1500px;">
            ${wordHtml}
          </div>
        </div>

        <div data-ref="coord" style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
          opacity: 0;
        ">
          <span>X 1240.00</span><span>Y 360.00</span><span>T 0.00s</span>
          <span style="margin-left: auto;">UNIT: PX &middot; SCALE 1:1</span>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const frame = host?.querySelector('[data-ref="frame"]') as HTMLElement;
		const tag = host?.querySelector('[data-ref="tag"]') as HTMLElement;
		const coord = host?.querySelector('[data-ref="coord"]') as HTMLElement;

		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		frame.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
		});

		coord.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 300,
			delay: 100,
		});

		tag.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 300 },
		);

		const wordCount = 6;
		for (let i = 0; i < wordCount; i++) {
			const word = host?.querySelector(`[data-ref="word${i}"]`) as HTMLElement;
			word.animate(
				[
					{ opacity: 0, transform: "translateY(14px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 300, delay: 500 + i * 180 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
