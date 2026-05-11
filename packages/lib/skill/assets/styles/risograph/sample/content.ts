import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-content",
	advances: [2.0, 4.0],
	voiceover:
		"Content cards in Risograph. A paragraph in body text with one key phrase highlighted by a pink rectangle behind it.",

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
          background-image: url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>&quot;);
          opacity: var(--grain-opacity); mix-blend-mode: multiply;
        "></div>

        <div data-ref="headline" style="
          position: absolute;
          left: var(--safe-x);
          top: 140px;
          font-family: var(--font-display);
          font-size: 160px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          transform: rotate(-3deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">what we believe.</span>
            <span style="position: relative;">what we believe.</span>
          </span>
        </div>

        <div style="position: absolute; left: 140px; right: 140px; top: 460px;">
          <div data-ref="para1" style="
            font-size: 44px;
            line-height: 1.4;
            font-weight: 600;
            max-width: 1500px;
            transform: rotate(-1deg);
            opacity: 0;
          ">the next decade of AI is not about <span style="background: var(--color-accent); padding: 0 8px; box-decoration-break: clone;">bigger models</span>.</div>

          <div data-ref="para2" style="
            font-size: 36px;
            line-height: 1.4;
            max-width: 1500px;
            font-weight: 500;
            margin-top: 36px;
            transform: rotate(1deg);
            opacity: 0;
          ">it's about agents that can <span style="color: var(--color-accent); font-weight: 700;">run long enough to matter</span> &#8212; and the unglamorous infrastructure that lets them.</div>

          <div data-ref="mark" style="margin-top: 60px; transform: rotate(-2deg); opacity: 0;">
            <div style="font-family: var(--font-display); font-size: 40px; color: var(--color-accent);">&#9733; &#9733; &#9733;</div>
            <div style="font-family: var(--font-mono); font-size: 18px; font-weight: 700; letter-spacing: 0.15em; margin-top: 10px;">BEACON TEAM &#183; 2026.05</div>
          </div>
        </div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 09/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const headline = host?.querySelector('[data-ref="headline"]') as HTMLElement;
		const para1 = host?.querySelector('[data-ref="para1"]') as HTMLElement;
		const para2 = host?.querySelector('[data-ref="para2"]') as HTMLElement;
		const mark = host?.querySelector('[data-ref="mark"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		headline.animate(
			[
				{ opacity: 0, transform: "rotate(-3deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-3deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 200 },
		);

		para1.animate(
			[
				{ opacity: 0, transform: "rotate(-1deg)" },
				{ opacity: 1, transform: "rotate(-1deg)" },
			],
			{ ...opts, duration: 280, delay: 700 },
		);

		para2.animate(
			[
				{ opacity: 0, transform: "rotate(1deg)" },
				{ opacity: 1, transform: "rotate(1deg)" },
			],
			{ ...opts, duration: 280, delay: 1300 },
		);

		mark.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 280, delay: 1800 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
