import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-content",
	advances: [2.5, 5.0],
	voiceover:
		"Content cards in Iso Diagram. A body paragraph with a key phrase underlined by a hand-drawn stroke, and a small isometric illustration to the side.",

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

        <div data-ref="heading" style="
          position: absolute;
          left: 140px;
          top: 180px;
          opacity: 0;
        ">
          <div style="font-family: var(--font-display); font-size: 130px;">What we believe.</div>
          <svg style="margin-top: 8px;" width="520" height="14">
            <path data-ref="headingUnderline" d="M 0 6 q 86 -8 172 0 t 172 0 t 172 0" stroke="var(--color-accent)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600" />
          </svg>
        </div>

        <div style="
          position: absolute;
          left: 140px;
          right: 140px;
          top: 440px;
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 64px;
        ">
          <div data-ref="body" style="opacity: 0;">
            <div style="font-family: var(--font-body); font-size: 34px; line-height: 1.5;">
              The next decade of AI is not about
              <span style="position: relative; display: inline-block;">bigger models
                <svg style="position: absolute; left: 0; right: 0; bottom: -10px; width: 100%;" height="14">
                  <path data-ref="phraseUnderline" d="M 4 8 q 60 -8 120 0 t 120 0" stroke="var(--color-accent)" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-dasharray="300" stroke-dashoffset="300" />
                </svg>
              </span>.
            </div>
            <div style="font-family: var(--font-body); font-size: 30px; line-height: 1.5; margin-top: 32px; color: var(--color-muted);">
              It's about agents that can <span style="color: var(--color-accent);">run long enough to matter</span> — and the unglamorous infrastructure that lets them.
            </div>
          </div>

          <div data-ref="illustration" style="opacity: 0;">
            <svg width="100%" height="380" style="overflow: visible;">
              <g transform="translate(120,80)">
                <polygon data-ref="isoTop0" points="0,40 80,0 160,40 80,80" fill="var(--fill-blue)" opacity="0" />
                <polygon data-ref="isoLeft0" points="0,40 80,80 80,120 0,80" fill="var(--fill-blue)" opacity="0" />
                <polygon data-ref="isoRight0" points="80,80 160,40 160,80 80,120" fill="var(--fill-blue)" opacity="0" />
                <path data-ref="isoOutline0" d="M0,40 L80,0 L160,40 L80,80 Z M0,40 L80,80 L80,120 L0,80 Z M80,80 L160,40 L160,80 L80,120" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="700" stroke-dashoffset="700" />
              </g>
              <g transform="translate(200,120)">
                <polygon data-ref="isoTop1" points="0,40 80,0 160,40 80,80" fill="var(--fill-yellow)" opacity="0" />
                <polygon data-ref="isoLeft1" points="0,40 80,80 80,120 0,80" fill="var(--fill-yellow)" opacity="0" />
                <polygon data-ref="isoRight1" points="80,80 160,40 160,80 80,120" fill="var(--fill-yellow)" opacity="0" />
                <path data-ref="isoOutline1" d="M0,40 L80,0 L160,40 L80,80 Z M0,40 L80,80 L80,120 L0,80 Z M80,80 L160,40 L160,80 L80,120" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="700" stroke-dashoffset="700" />
              </g>
              <g transform="translate(40,120)">
                <polygon data-ref="isoTop2" points="0,40 80,0 160,40 80,80" fill="var(--fill-pink)" opacity="0" />
                <polygon data-ref="isoLeft2" points="0,40 80,80 80,120 0,80" fill="var(--fill-pink)" opacity="0" />
                <polygon data-ref="isoRight2" points="80,80 160,40 160,80 80,120" fill="var(--fill-pink)" opacity="0" />
                <path data-ref="isoOutline2" d="M0,40 L80,0 L160,40 L80,80 Z M0,40 L80,80 L80,120 L0,80 Z M80,80 L160,40 L160,80 L80,120" stroke="var(--color-fg)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="700" stroke-dashoffset="700" />
              </g>
              <path data-ref="leaderLine" d="M 280 260 Q 310 230 420 340" stroke="var(--color-accent)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-dasharray="250" stroke-dashoffset="250" />
              <text data-ref="leaderText" x="430" y="345" font-family="var(--font-display)" font-size="40" fill="var(--color-accent)" transform="rotate(-3 430 345)" opacity="0">us, building.</text>
            </svg>
          </div>
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
        ">~ scene 9 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const headingUnderline = host?.querySelector('[data-ref="headingUnderline"]') as SVGPathElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;
		const phraseUnderline = host?.querySelector('[data-ref="phraseUnderline"]') as SVGPathElement;
		const illustration = host?.querySelector('[data-ref="illustration"]') as HTMLElement;
		const leaderLine = host?.querySelector('[data-ref="leaderLine"]') as SVGPathElement;
		const leaderText = host?.querySelector('[data-ref="leaderText"]') as SVGTextElement;
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

		body.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 800 },
		);

		phraseUnderline.animate([{ strokeDashoffset: "300" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 1300,
		});

		illustration.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300, delay: 1400 });

		// Draw iso cube outlines and flood fills
		for (let i = 0; i < 3; i++) {
			const outline = host?.querySelector(`[data-ref="isoOutline${i}"]`) as SVGPathElement;
			const top = host?.querySelector(`[data-ref="isoTop${i}"]`) as SVGPolygonElement;
			const left = host?.querySelector(`[data-ref="isoLeft${i}"]`) as SVGPolygonElement;
			const right = host?.querySelector(`[data-ref="isoRight${i}"]`) as SVGPolygonElement;

			const base = 1400 + i * 200;
			outline.animate([{ strokeDashoffset: "700" }, { strokeDashoffset: "0" }], {
				...opts,
				duration: 500,
				delay: base,
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

		// Leader line and label
		leaderLine.animate([{ strokeDashoffset: "250" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 2200,
		});
		leaderText.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300, delay: 2600 });

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
