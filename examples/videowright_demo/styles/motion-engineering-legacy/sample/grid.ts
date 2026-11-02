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
	id: "motion-engineering-sample-grid",
	advances: [2.5, 5.0],
	voiceover:
		"Card grids in Motion Engineering. Three cards framed with amber corner ticks, each containing a wireframe diagram, name, and metric.",

	mount(el) {
		host = el;

		const cards = [
			{ n: "01", name: "Memory", metric: "120 snap/min", sym: "M" },
			{ n: "02", name: "Reasoning", metric: "9 ms restore", sym: "R" },
			{ n: "03", name: "Recovery", metric: "0 lost steps", sym: "C" },
		];

		const cardHtml = cards
			.map(
				(c, i) => `
        <div data-ref="card${i}" style="
          position: relative;
          padding: 32px;
          border: 1px solid var(--color-border);
          min-height: 420px;
          opacity: 0;
        ">
          ${cornerTicks()}

          <div style="
            font-family: var(--font-mono);
            font-size: 12px;
            letter-spacing: 0.25em;
            color: var(--color-muted);
          ">PRIMITIVE ${c.n} / 03</div>

          <svg width="200" height="160" style="margin-top: 28px;">
            <circle cx="100" cy="80" r="50" fill="none" stroke="var(--color-accent)" stroke-width="1.5" />
            <text x="100" y="92" fill="var(--color-accent)" font-family="var(--font-display)" font-size="44" font-weight="500" text-anchor="middle">${c.sym}</text>
            <line x1="40" y1="80" x2="160" y2="80" stroke="var(--color-muted)" stroke-dasharray="2 4" />
          </svg>

          <div style="
            font-family: var(--font-display);
            font-weight: 500;
            font-size: 56px;
            margin-top: 24px;
          ">${c.name}</div>

          <div style="
            font-family: var(--font-mono);
            font-size: 14px;
            margin-top: 16px;
            letter-spacing: 0.15em;
            color: var(--cyan);
          ">&#9698; ${c.metric}</div>
        </div>`,
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

          <div data-ref="header" style="position: absolute; left: 80px; top: 100px; opacity: 0;">
            <div style="
              font-family: var(--font-mono);
              font-size: 13px;
              letter-spacing: 0.25em;
              color: var(--color-accent);
              margin-bottom: 18px;
            ">&#9698; FIG. 07 &middot; PRIMITIVES (3)</div>
            <div style="
              font-family: var(--font-display);
              font-weight: 500;
              font-size: 84px;
            ">Three primitives.</div>
          </div>

          <div style="
            position: absolute; left: 80px; right: 80px; top: 380px;
            display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px;
          ">
            ${cardHtml}
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
		const header = host?.querySelector('[data-ref="header"]') as HTMLElement;
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

		header.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 360, delay: 200 },
		);

		for (let i = 0; i < 3; i++) {
			const card = host?.querySelector(`[data-ref="card${i}"]`) as HTMLElement;
			card.animate(
				[
					{ opacity: 0, transform: "translateY(16px)" },
					{ opacity: 1, transform: "translateY(0)" },
				],
				{ ...opts, duration: 360, delay: 600 + i * 150 },
			);
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
