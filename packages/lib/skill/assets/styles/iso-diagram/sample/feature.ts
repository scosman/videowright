import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-feature",
	advances: [2.5, 5.0],
	voiceover:
		"Feature cards in Iso Diagram. An isometric stack of memory blocks on the left with outlines drawing on and pastel fills flooding in, feature details on the right.",

	mount(el) {
		host = el;
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

        <svg style="position: absolute; left: 140px; top: 200px; overflow: visible;" width="800" height="700">
          ${[0, 1, 2, 3]
						.map(
							(i) => `
            <g data-ref="block${i}" transform="translate(200,${500 - i * 90})">
              <polygon data-ref="blockTop${i}" points="0,40 160,-40 320,40 160,120" fill="${i === 3 ? "var(--fill-pink)" : "var(--fill-blue)"}" opacity="0" />
              <polygon data-ref="blockLeft${i}" points="0,40 160,120 160,180 0,100" fill="${i === 3 ? "var(--fill-pink)" : "var(--fill-blue)"}" opacity="0" />
              <polygon data-ref="blockRight${i}" points="160,120 320,40 320,100 160,180" fill="${i === 3 ? "var(--fill-pink)" : "var(--fill-blue)"}" opacity="0" />
              <path data-ref="blockOutlineA${i}" d="M0,40 L160,-40 L320,40 L160,120 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="750" stroke-dashoffset="750" />
              <path data-ref="blockOutlineB${i}" d="M0,40 L160,120 L160,180 L0,100 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="750" stroke-dashoffset="750" />
              <path data-ref="blockOutlineC${i}" d="M160,120 L320,40 L320,100 L160,180 Z" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="750" stroke-dashoffset="750" />
            </g>`,
						)
						.join("")}

          <path data-ref="leader" d="M 600 180 Q 630 150 540 140" stroke="var(--color-accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="200" stroke-dashoffset="200" />
          <polygon data-ref="arrow" points="540,140 555,130 555,150" fill="var(--color-accent)" opacity="0" />
          <text data-ref="leaderLabel" x="470" y="115" font-family="var(--font-display)" font-size="40" fill="var(--color-accent)" transform="rotate(-6 470 115)" opacity="0">rewind</text>
        </svg>

        <div data-ref="featureTag" style="
          position: absolute;
          right: var(--safe-x);
          top: 180px;
          width: 720px;
          font-family: var(--font-mono);
          font-size: 18px;
          letter-spacing: 0.1em;
          color: var(--color-muted);
          opacity: 0;
        ">FEATURE 01 / 03</div>

        <div data-ref="featureName" style="
          position: absolute;
          right: var(--safe-x);
          top: 240px;
          width: 720px;
          font-family: var(--font-display);
          font-size: 120px;
          color: var(--color-accent);
          opacity: 0;
        ">Checkpoint memory.</div>

        <svg data-ref="nameUnderline" style="position: absolute; right: var(--safe-x); top: 400px;" width="520" height="14">
          <path data-ref="nameUnderlinePath" d="M 0 6 q 86 -8 172 0 t 172 0 t 172 0" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600" />
        </svg>

        <div data-ref="featureDesc" style="
          position: absolute;
          right: var(--safe-x);
          top: 440px;
          width: 720px;
          font-family: var(--font-body);
          font-size: 28px;
          line-height: 1.5;
          opacity: 0;
        ">Snapshots the agent's reasoning at each tool boundary. When a plan goes stale, the agent rewinds to the last correct checkpoint.</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 6 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;
		const featureTag = host?.querySelector('[data-ref="featureTag"]') as HTMLElement;
		const featureName = host?.querySelector('[data-ref="featureName"]') as HTMLElement;
		const nameUnderlinePath = host?.querySelector(
			'[data-ref="nameUnderlinePath"]',
		) as SVGPathElement;
		const featureDesc = host?.querySelector('[data-ref="featureDesc"]') as HTMLElement;
		const leader = host?.querySelector('[data-ref="leader"]') as SVGPathElement;
		const arrow = host?.querySelector('[data-ref="arrow"]') as SVGPolygonElement;
		const leaderLabel = host?.querySelector('[data-ref="leaderLabel"]') as SVGTextElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		// Feature tag and name
		featureTag.animate(
			[
				{ opacity: 0, transform: "rotate(-1deg) translateY(8px)" },
				{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 400 },
		);

		featureName.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 700 },
		);

		nameUnderlinePath.animate([{ strokeDashoffset: "600" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 1300,
		});

		// Iso blocks: outlines draw on then fills flood
		for (let i = 0; i < 4; i++) {
			const outA = host?.querySelector(`[data-ref="blockOutlineA${i}"]`) as SVGPathElement;
			const outB = host?.querySelector(`[data-ref="blockOutlineB${i}"]`) as SVGPathElement;
			const outC = host?.querySelector(`[data-ref="blockOutlineC${i}"]`) as SVGPathElement;
			const top = host?.querySelector(`[data-ref="blockTop${i}"]`) as SVGPolygonElement;
			const left = host?.querySelector(`[data-ref="blockLeft${i}"]`) as SVGPolygonElement;
			const right = host?.querySelector(`[data-ref="blockRight${i}"]`) as SVGPolygonElement;

			const base = 500 + i * 200;
			outA.animate([{ strokeDashoffset: "750" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 500,
				delay: base,
			});
			outB.animate([{ strokeDashoffset: "750" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 500,
				delay: base + 150,
			});
			outC.animate([{ strokeDashoffset: "750" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 500,
				delay: base + 150,
			});
			top.animate([{ opacity: 0 }, { opacity: 0.9 }], {
				...opts,
				duration: 400,
				delay: base + 400,
			});
			left.animate([{ opacity: 0 }, { opacity: 0.65 }], {
				...opts,
				duration: 400,
				delay: base + 450,
			});
			right.animate([{ opacity: 0 }, { opacity: 0.5 }], {
				...opts,
				duration: 400,
				delay: base + 450,
			});
		}

		featureDesc.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 1400 },
		);

		// Leader line and label
		leader.animate([{ strokeDashoffset: "200" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 2000,
		});
		arrow.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200, delay: 2400 });
		leaderLabel.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200, delay: 2400 });

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
