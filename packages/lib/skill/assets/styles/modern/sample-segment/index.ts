import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "modern-sample",
	advances: [2.5, 6.0],
	voiceover:
		"The Modern style. Dark surfaces, restrained motion, and a single accent that earns its place.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
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
        <!-- Left: editorial text stack -->
        <div style="display: flex; flex-direction: column; gap: var(--space-6);">
          <p style="
            font-family: var(--font-mono);
            font-size: var(--text-sm);
            color: var(--color-accent);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin: 0;
            opacity: 0;
          " data-ref="label">Style Preview</p>
          <h1 style="
            font-family: var(--font-display);
            font-size: var(--text-4xl);
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.1;
            margin: 0;
            opacity: 0;
          " data-ref="heading">Precision without<br>the pretense.</h1>
          <p style="
            font-size: var(--text-lg);
            color: var(--color-muted);
            line-height: 1.6;
            max-width: 420px;
            margin: 0;
            opacity: 0;
          " data-ref="body">Every token, every transition, every whitespace decision is intentional. The content leads; the style stays out of its way.</p>
        </div>

        <!-- Right: metric card with glow -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: relative;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            padding: var(--space-12) var(--space-16);
            text-align: center;
            min-width: 320px;
            opacity: 0;
          " data-ref="card">
            <div style="
              position: absolute;
              inset: -1px;
              border-radius: var(--radius-lg);
              background: transparent;
              box-shadow: var(--shadow-glow);
              opacity: 0;
              pointer-events: none;
            " data-ref="glow"></div>
            <p style="
              font-family: var(--font-mono);
              font-size: var(--text-xs);
              color: var(--color-subtle);
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 0 0 var(--space-4) 0;
            ">Design Tokens</p>
            <p style="
              font-family: var(--font-display);
              font-size: 5rem;
              font-weight: 700;
              color: var(--color-accent-soft);
              margin: 0;
              line-height: 1;
              letter-spacing: -0.03em;
            " data-ref="metric">24</p>
            <p style="
              font-size: var(--text-sm);
              color: var(--color-muted);
              margin: var(--space-4) 0 0 0;
            ">CSS custom properties on <code style="
              font-family: var(--font-mono);
              font-size: var(--text-xs);
              background: var(--color-elevated);
              padding: 0.15em 0.4em;
              border-radius: var(--radius-sm);
              color: var(--color-accent);
            ">:root</code></p>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const label = host?.querySelector('[data-ref="label"]') as HTMLElement;
		const heading = host?.querySelector('[data-ref="heading"]') as HTMLElement;
		const body = host?.querySelector('[data-ref="body"]') as HTMLElement;
		const card = host?.querySelector('[data-ref="card"]') as HTMLElement;
		const glow = host?.querySelector('[data-ref="glow"]') as HTMLElement;

		const enter = {
			easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			fill: "forwards" as const,
		};

		// Staggered entrance using WAAPI delay (render-safe)

		// Monospace label fades in first -- fast, no transform
		label.animate([{ opacity: 0 }, { opacity: 1 }], {
			...enter,
			duration: 300,
		});

		// Headline rises into place
		heading.animate(
			[
				{ opacity: 0, transform: "translateY(16px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...enter, duration: 500, delay: 120 },
		);

		// Body text follows
		body.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...enter, duration: 450, delay: 220 },
		);

		// Card scales up from 0.96 -- restrained, confident
		card.animate(
			[
				{ opacity: 0, transform: "scale(0.96)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ ...enter, duration: 500, delay: 420 },
		);

		// Glow blooms behind the card -- the moment of visual interest
		glow.animate([{ opacity: 0 }, { opacity: 1 }], {
			...enter,
			duration: 800,
			delay: 720,
		});

		await ctx.waitForNext(); // Beat 1: composition fully revealed
	},

	unmount() {
		host = null;
	},
});
