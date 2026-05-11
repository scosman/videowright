import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-grid",
	advances: [2.5, 5.0],
	voiceover:
		"Card grids in Iso Diagram. Three isometric mini-diagrams in a row, each framed with a hand-drawn box and a labeled cube inside.",

	mount(el) {
		host = el;

		const cards = [
			{ name: "Memory", fill: "var(--fill-blue)", desc: "~ remembers ~" },
			{ name: "Reasoning", fill: "var(--fill-yellow)", desc: "~ revises ~" },
			{ name: "Recovery", fill: "var(--fill-green)", desc: "~ rewinds ~" },
		];

		const cardHtml = cards
			.map(
				(c, i) => `
        <div data-ref="card${i}" style="
          position: relative;
          height: 540px;
          opacity: 0;
        ">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible;">
            <path data-ref="frame${i}" d="M 8 8 L 528 12 L 524 528 L 12 524 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2100" stroke-dashoffset="2100" />
          </svg>
          <svg width="100%" height="280" style="overflow: visible;">
            <g transform="translate(170,80)">
              <polygon data-ref="cubeTop${i}" points="0,45 90,0 180,45 90,90" fill="${c.fill}" opacity="0" />
              <polygon data-ref="cubeLeft${i}" points="0,45 90,90 90,135 0,90" fill="${c.fill}" opacity="0" />
              <polygon data-ref="cubeRight${i}" points="90,90 180,45 180,90 90,135" fill="${c.fill}" opacity="0" />
              <path data-ref="cubeOutlineA${i}" d="M0,45 L90,0 L180,45 L90,90 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="400" stroke-dashoffset="400" />
              <path data-ref="cubeOutlineB${i}" d="M0,45 L90,90 L90,135 L0,90 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="400" stroke-dashoffset="400" />
              <path data-ref="cubeOutlineC${i}" d="M90,90 L180,45 L180,90 L90,135 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="400" stroke-dashoffset="400" />
            </g>
          </svg>
          <div style="font-family: var(--font-display); font-size: 80px; text-align: center; margin-top: 24px;">${c.name}</div>
          <div style="font-family: var(--font-display); font-size: 40px; text-align: center; margin-top: -4px; color: var(--color-muted);">${c.desc}</div>
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
          background-image: radial-gradient(circle, rgba(42,38,32,0.10) 1px, transparent 1.6px);
          background-size: 32px 32px;
        "></div>

        <div data-ref="heading" style="
          position: absolute;
          left: 140px;
          top: 120px;
          opacity: 0;
        ">
          <div style="font-family: var(--font-display); font-size: 130px;">Three primitives.</div>
          <svg style="margin-top: 8px;" width="520" height="14">
            <path data-ref="headingUnderline" d="M 0 6 q 86 -8 172 0 t 172 0 t 172 0" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600" />
          </svg>
        </div>

        <div style="
          position: absolute; left: 140px; right: 140px; top: 400px;
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 56px;
        ">
          ${cardHtml}
        </div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 7 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const headingUnderline = host?.querySelector('[data-ref="headingUnderline"]') as SVGPathElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		heading.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 300 },
		);

		headingUnderline.animate([{ strokeDashoffset: "600" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 700,
		});

		for (let i = 0; i < 3; i++) {
			const card = host?.querySelector(`[data-ref="card${i}"]`) as HTMLElement;
			const frame = host?.querySelector(`[data-ref="frame${i}"]`) as SVGPathElement;
			const outA = host?.querySelector(`[data-ref="cubeOutlineA${i}"]`) as SVGPathElement;
			const outB = host?.querySelector(`[data-ref="cubeOutlineB${i}"]`) as SVGPathElement;
			const outC = host?.querySelector(`[data-ref="cubeOutlineC${i}"]`) as SVGPathElement;
			const top = host?.querySelector(`[data-ref="cubeTop${i}"]`) as SVGPolygonElement;
			const left = host?.querySelector(`[data-ref="cubeLeft${i}"]`) as SVGPolygonElement;
			const right = host?.querySelector(`[data-ref="cubeRight${i}"]`) as SVGPolygonElement;

			const base = 900 + i * 200;

			card.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 250, delay: base });

			// Frame draws on
			frame.animate([{ strokeDashoffset: "2100" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 600,
				delay: base,
			});

			// Cube outlines draw on
			outA.animate([{ strokeDashoffset: "400" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 400,
				delay: base + 200,
			});
			outB.animate([{ strokeDashoffset: "400" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 400,
				delay: base + 350,
			});
			outC.animate([{ strokeDashoffset: "400" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 400,
				delay: base + 350,
			});

			// Fills flood in
			top.animate([{ opacity: 0 }, { opacity: 0.9 }], {
				...opts,
				duration: 400,
				delay: base + 550,
			});
			left.animate([{ opacity: 0 }, { opacity: 0.65 }], {
				...opts,
				duration: 400,
				delay: base + 600,
			});
			right.animate([{ opacity: 0 }, { opacity: 0.5 }], {
				...opts,
				duration: 400,
				delay: base + 600,
			});
		}

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
