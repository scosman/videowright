import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "risograph-sample-section",
	advances: [2.0, 4.0],
	voiceover:
		"Section headers in Risograph. A big pink chapter number overlaps the section title, the whole thing tilted.",

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

        <!-- Pink-dominant variant: blue ghost / pink top — the chapter number is the accent element per the recipe -->
        <div data-ref="number" style="
          position: absolute;
          left: 80px;
          top: 100px;
          font-family: var(--font-display);
          font-size: 760px;
          line-height: 0.85;
          transform: rotate(-4deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-fg); pointer-events: none;" aria-hidden="true">02</span>
            <span style="position: relative; color: var(--color-accent);">02</span>
          </span>
        </div>

        <div data-ref="title" style="
          position: absolute;
          left: 700px;
          top: 560px;
          font-family: var(--font-display);
          font-size: 200px;
          line-height: 0.9;
          letter-spacing: -0.025em;
          transform: rotate(-2deg);
          opacity: 0;
        ">
          <span style="position: relative; display: inline-block;">
            <span style="position: absolute; left: var(--misreg); top: var(--misreg); color: var(--color-accent); pointer-events: none;" aria-hidden="true">the architecture</span>
            <span style="position: relative; color: var(--color-fg);">the architecture</span>
          </span>
        </div>

        <div data-ref="subtitle" style="
          position: absolute;
          left: 720px;
          top: 820px;
          font-family: var(--font-body);
          font-size: 30px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transform: rotate(1deg);
          opacity: 0;
        ">memory &#183; reasoning &#183; recovery</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 60px;
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--color-accent);
          transform: rotate(-3deg);
          opacity: 0;
        ">&#9733; 02/10 &#9733;</div>
      </div>
    `;
	},

	async play(ctx) {
		const number = host?.querySelector('[data-ref="number"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const subtitle = host?.querySelector('[data-ref="subtitle"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "steps(6, end)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 200 });

		number.animate(
			[
				{ opacity: 0, transform: "rotate(-4deg) scale(0.85)" },
				{ opacity: 1, transform: "rotate(-4deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 300 },
		);

		title.animate(
			[
				{ opacity: 0, transform: "rotate(-2deg) scale(0.9)" },
				{ opacity: 1, transform: "rotate(-2deg) scale(1)" },
			],
			{ ...opts, duration: 300, delay: 900 },
		);

		subtitle.animate(
			[
				{ opacity: 0, transform: "rotate(1deg)" },
				{ opacity: 1, transform: "rotate(1deg)" },
			],
			{ ...opts, duration: 280, delay: 1400 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
