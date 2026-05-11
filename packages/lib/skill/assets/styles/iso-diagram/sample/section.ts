import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "iso-diagram-sample-section",
	advances: [2.5, 5.0],
	voiceover:
		"Section headers in Iso Diagram. A big handwritten chapter number with the section title below and a curly underline that draws itself on.",

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

        <div data-ref="chapter" style="
          position: absolute;
          left: var(--safe-x);
          top: 180px;
          font-family: var(--font-display);
          font-size: 80px;
          color: var(--color-muted);
          opacity: 0;
          transform: rotate(-3deg);
        ">Chapter</div>

        <div data-ref="number" style="
          position: absolute;
          left: var(--safe-x);
          top: 260px;
          font-family: var(--font-display);
          font-size: 420px;
          line-height: 0.9;
          color: var(--color-accent);
          opacity: 0;
        ">02</div>

        <div data-ref="title" style="
          position: absolute;
          left: calc(var(--safe-x) + 400px);
          top: 380px;
          font-family: var(--font-display);
          font-size: 160px;
          opacity: 0;
        ">The architecture.</div>

        <svg data-ref="underlineSvg" style="position: absolute; left: calc(var(--safe-x) + 400px); top: 580px;" width="720" height="14">
          <path data-ref="underline" d="M 0 6 q 120 -8 240 0 t 240 0 t 240 0" stroke="var(--color-fg)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-dasharray="900" stroke-dashoffset="900" />
        </svg>

        <div data-ref="caption" style="
          position: absolute;
          left: calc(var(--safe-x) + 400px);
          top: 640px;
          font-family: var(--font-body);
          font-size: 32px;
          color: var(--color-muted);
          opacity: 0;
        ">three primitives: memory, reasoning, recovery</div>

        <div data-ref="counter" style="
          position: absolute;
          right: var(--safe-x);
          top: 36px;
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--color-muted);
          transform: rotate(-2deg);
          opacity: 0;
        ">~ scene 2 of 10 ~</div>
      </div>
    `;
	},

	async play(ctx) {
		const chapter = host?.querySelector('[data-ref="chapter"]') as HTMLElement;
		const number = host?.querySelector('[data-ref="number"]') as HTMLElement;
		const title = host?.querySelector('[data-ref="title"]') as HTMLElement;
		const underline = host?.querySelector('[data-ref="underline"]') as SVGPathElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;
		const counter = host?.querySelector('[data-ref="counter"]') as HTMLElement;

		const ease = "cubic-bezier(0.34, 1.2, 0.64, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		counter.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, duration: 300 });

		// Chapter label swings in
		chapter.animate(
			[
				{ opacity: 0, transform: "rotate(-5deg) translateY(12px)" },
				{ opacity: 1, transform: "rotate(-3deg) translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 300 },
		);

		// Big number
		number.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400, delay: 700 },
		);

		// Section title swings in
		title.animate(
			[
				{ opacity: 0, transform: "rotate(-1deg) translateY(12px)" },
				{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
			],
			{ ...opts, duration: 350, delay: 1300 },
		);

		// Underline draws on
		underline.animate([{ strokeDashoffset: "900" }, { strokeDashoffset: "0" }], {
			...opts,
			duration: 500,
			delay: 1800,
		});

		// Caption
		caption.animate(
			[
				{ opacity: 0, transform: "rotate(-1deg) translateY(8px)" },
				{ opacity: 1, transform: "rotate(0deg) translateY(0)" },
			],
			{ ...opts, duration: 300, delay: 2000 },
		);

		await ctx.waitForNext();
	},

	unmount() {
		host = null;
	},
});
