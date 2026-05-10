import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "bauhaus-sample",
	advances: [3.0, 7.0],
	voiceover:
		"The Bauhaus style. Pure geometry, primary colors, and a grid that means what it says.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        width: 100%;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
        box-sizing: border-box;
      ">
        <!-- Large blue circle — top-right compositional anchor -->
        <div style="
          position: absolute;
          top: -4rem;
          right: -4rem;
          width: 22rem;
          height: 22rem;
          border-radius: 50%;
          background: var(--color-blue);
          transform: scale(0);
          transform-origin: center;
        " data-ref="circle"></div>

        <!-- Red horizontal bar — structural divider -->
        <div style="
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 0.5rem;
          background: var(--color-red);
          transform: scaleX(0);
          transform-origin: left center;
        " data-ref="bar"></div>

        <!-- Yellow square — bottom-left geometric element -->
        <div style="
          position: absolute;
          bottom: var(--space-16);
          left: var(--space-16);
          width: 8rem;
          height: 8rem;
          background: var(--color-yellow);
          transform: scale(0);
          transform-origin: center;
        " data-ref="square"></div>

        <!-- Small black rectangle — rhythm element near yellow square -->
        <div style="
          position: absolute;
          bottom: var(--space-16);
          left: calc(var(--space-16) + 10rem);
          width: 2rem;
          height: 8rem;
          background: var(--color-fg);
          transform: scaleY(0);
          transform-origin: bottom center;
        " data-ref="rect-accent"></div>

        <!-- Text block — left-aligned, asymmetric placement -->
        <div style="
          position: absolute;
          top: 50%;
          left: var(--space-16);
          transform: translateY(calc(-100% - 2rem));
          max-width: 560px;
        ">
          <p style="
            font-family: var(--font-display);
            font-size: var(--text-xs);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-muted);
            margin: 0 0 var(--space-4) 0;
            opacity: 0;
          " data-ref="label">Style / 03</p>
          <h1 style="
            font-family: var(--font-display);
            font-size: var(--text-5xl);
            font-weight: 800;
            letter-spacing: -0.04em;
            line-height: 0.95;
            margin: 0;
            transform: translateX(-2rem);
            clip-path: inset(0 100% 0 0);
          " data-ref="heading">Form<br>follows<br>function.</h1>
        </div>

        <!-- Bottom-right caption — below the red bar -->
        <div style="
          position: absolute;
          bottom: var(--space-16);
          right: var(--space-16);
          text-align: right;
          max-width: 280px;
        ">
          <p style="
            font-family: var(--font-body);
            font-size: var(--text-sm);
            font-weight: 500;
            line-height: 1.5;
            letter-spacing: 0.01em;
            color: var(--color-fg);
            margin: 0;
            opacity: 0;
          " data-ref="caption">Circle, square, rectangle. Three shapes, three colors, one grid. Every element placed with intention.</p>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const circle = host?.querySelector('[data-ref="circle"]') as HTMLElement;
		const bar = host?.querySelector('[data-ref="bar"]') as HTMLElement;
		const square = host?.querySelector('[data-ref="square"]') as HTMLElement;
		const rectAccent = host?.querySelector('[data-ref="rect-accent"]') as HTMLElement;
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const caption = host?.querySelector('[data-ref="caption"]') as HTMLElement;

		const geometric = {
			easing: "cubic-bezier(0.25, 0, 0, 1)",
			fill: "forwards" as const,
		};

		// Staggered entrance using WAAPI delay (render-safe)

		// 1. Blue circle scales from center — the anchor shape arrives first
		circle.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
			...geometric,
			duration: 500,
		});

		// 2. Red bar extends across the full width — structural divider
		bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
			...geometric,
			duration: 450,
			delay: 400,
		});

		// 3. Heading slides in along the x-axis — pure transform + clip-path reveal, no opacity
		heading.animate(
			[
				{ transform: "translateX(-2rem)", clipPath: "inset(0 100% 0 0)" },
				{ transform: "translateX(0)", clipPath: "inset(0 0 0 0)" },
			],
			{ ...geometric, duration: 400, delay: 700 },
		);

		// 4. Label fades in — secondary element, opacity only
		label.animate([{ opacity: 0 }, { opacity: 1 }], {
			...geometric,
			duration: 300,
			delay: 900,
		});

		// 5. Yellow square scales up — geometric counterweight to the circle
		square.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
			...geometric,
			duration: 400,
			delay: 1150,
		});

		// 6. Black accent rectangle extends upward
		rectAccent.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
			...geometric,
			duration: 350,
			delay: 1300,
		});

		// 7. Caption fades in — the last element, completing the composition
		caption.animate([{ opacity: 0 }, { opacity: 1 }], {
			...geometric,
			duration: 350,
			delay: 1500,
		});

		await ctx.waitForNext(); // Beat 1: full composition held for appreciation
	},

	unmount() {
		host = null;
	},
});
