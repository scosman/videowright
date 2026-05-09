import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "retro-sample",
	advances: [2.5, 6.0],
	voiceover:
		"The Retro style. Warm darks, neon accents, and typography with real personality — the eighties, refined for today.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        padding: var(--space-16) var(--space-24);
        box-sizing: border-box;
        gap: var(--space-16);
        overflow: hidden;
      ">
        <!-- Scan-line overlay — barely visible texture -->
        <div style="
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            var(--color-scanline) 3px,
            var(--color-scanline) 4px
          );
          z-index: 10;
        "></div>

        <!-- Left: editorial text stack -->
        <div style="display: flex; flex-direction: column; gap: var(--space-6);">
          <!-- Accent bar — bold horizontal rule -->
          <div style="
            width: 0;
            height: 4px;
            background: var(--color-accent);
            box-shadow: var(--shadow-neon);
            border-radius: 2px;
          " data-ref="bar"></div>

          <p style="
            font-family: var(--font-mono);
            font-size: var(--text-sm);
            color: var(--color-accent-secondary);
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin: 0;
            opacity: 0;
          " data-ref="label">Style Preview</p>

          <h1 style="
            font-family: var(--font-display);
            font-size: var(--text-4xl);
            font-weight: 700;
            letter-spacing: -0.01em;
            line-height: 1.1;
            margin: 0;
            opacity: 0;
          " data-ref="heading">Warmth meets<br><span style="color: var(--color-accent);">neon edge.</span></h1>

          <p style="
            font-size: var(--text-lg);
            color: var(--color-muted);
            line-height: 1.6;
            max-width: 440px;
            margin: 0;
            opacity: 0;
          " data-ref="body">Bold color, expressive type, and the analog warmth of a late-night broadcast. Every frame has character.</p>
        </div>

        <!-- Right: stacked stat cards with neon glow -->
        <div style="
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          align-items: center;
          justify-content: center;
        ">
          <!-- Primary stat card -->
          <div style="
            position: relative;
            background: var(--color-surface);
            border: 2px solid var(--color-border-strong);
            border-radius: var(--radius-lg);
            padding: var(--space-8) var(--space-12);
            text-align: center;
            min-width: 300px;
            opacity: 0;
          " data-ref="card-primary">
            <div style="
              position: absolute;
              inset: -2px;
              border-radius: var(--radius-lg);
              box-shadow: var(--shadow-neon);
              opacity: 0;
              pointer-events: none;
            " data-ref="glow-primary"></div>
            <p style="
              font-family: var(--font-mono);
              font-size: var(--text-xs);
              color: var(--color-subtle);
              text-transform: uppercase;
              letter-spacing: 0.12em;
              margin: 0 0 var(--space-3) 0;
            ">Design Tokens</p>
            <p style="
              font-family: var(--font-display);
              font-size: 4.5rem;
              font-weight: 700;
              color: var(--color-accent);
              margin: 0;
              line-height: 1;
              letter-spacing: -0.02em;
              text-shadow: 0 0 30px var(--color-accent-glow);
            " data-ref="metric">28</p>
          </div>

          <!-- Secondary badge card -->
          <div style="
            background: var(--color-elevated);
            border: 2px solid rgba(240, 176, 64, 0.2);
            border-radius: var(--radius-md);
            padding: var(--space-4) var(--space-8);
            display: flex;
            align-items: center;
            gap: var(--space-4);
            opacity: 0;
          " data-ref="card-secondary">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: var(--color-accent-secondary);
              box-shadow: var(--shadow-neon-amber);
            "></div>
            <span style="
              font-family: var(--font-mono);
              font-size: var(--text-sm);
              color: var(--color-accent-secondary);
              letter-spacing: 0.04em;
            ">3 font families loaded</span>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const bar = host?.querySelector('[data-ref="bar"]') as HTMLElement;
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;
		const cardPrimary = host?.querySelector('[data-ref="card-primary"]') as HTMLElement;
		const glowPrimary = host?.querySelector('[data-ref="glow-primary"]') as HTMLElement;
		const cardSecondary = host?.querySelector('[data-ref="card-secondary"]') as HTMLElement;

		const enter = {
			easing: "cubic-bezier(0.22, 1, 0.36, 1)",
			fill: "forwards" as const,
		};

		// Accent bar wipes in horizontally — the first visual anchor
		bar.animate([{ width: "0" }, { width: "80px" }], {
			...enter,
			duration: 450,
		});
		await ctx.hold(150);

		// Mono label fades in with a horizontal slide
		label.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...enter, duration: 350 },
		);
		await ctx.hold(120);

		// Headline slides in — the centerpiece
		heading.animate(
			[
				{ opacity: 0, transform: "translateX(-32px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...enter, duration: 500 },
		);
		await ctx.hold(100);

		// Body text follows
		body.animate(
			[
				{ opacity: 0, transform: "translateX(-24px)" },
				{ opacity: 1, transform: "translateX(0)" },
			],
			{ ...enter, duration: 450 },
		);
		await ctx.hold(250);

		// Primary card scales up with the bolder retro swing
		cardPrimary.animate(
			[
				{ opacity: 0, transform: "scale(0.85)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...enter, duration: 500 },
		);
		await ctx.hold(200);

		// Neon glow blooms behind the primary card
		glowPrimary.animate([{ opacity: 0 }, { opacity: 1 }], {
			...enter,
			duration: 700,
		});
		await ctx.hold(150);

		// Secondary badge slides in from below
		cardSecondary.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...enter, duration: 400 },
		);

		await ctx.waitForNext(); // Beat 1: full composition revealed
	},

	unmount() {
		host = null;
	},
});
