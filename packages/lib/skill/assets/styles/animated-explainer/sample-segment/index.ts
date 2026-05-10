import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "animated-explainer-sample",
	advances: [3.0, 7.0],
	voiceover:
		"The Animated Explainer style. Warm colors, illustrative shapes, and generous motion that guides you through every idea.",

	mount(el) {
		host = el;
		el.innerHTML = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: var(--color-bg);
        color: var(--color-fg);
        font-family: var(--font-body);
        overflow: hidden;
        box-sizing: border-box;
      ">
        <!-- Decorative background shapes -->
        <svg data-ref="bg-shapes" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <circle data-ref="blob-1" cx="240" cy="180" r="120" fill="var(--color-amber)" opacity="0" />
          <circle data-ref="blob-2" cx="1700" cy="860" r="90" fill="var(--color-teal)" opacity="0" />
          <rect data-ref="blob-3" x="1500" y="120" width="180" height="180" rx="40" fill="var(--color-lavender)" opacity="0" />
          <circle data-ref="blob-4" cx="320" cy="880" r="60" fill="var(--color-accent-soft)" opacity="0" />
          <rect data-ref="blob-5" x="880" y="50" width="120" height="120" rx="28" fill="var(--color-elevated)" opacity="0" />
        </svg>

        <!-- Main content card -->
        <div data-ref="card" style="
          position: relative;
          z-index: 1;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: var(--space-16) var(--space-24);
          max-width: 780px;
          width: 100%;
          box-shadow: var(--shadow-soft);
          opacity: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-8);
        ">
          <!-- Icon cluster -->
          <div data-ref="icon-group" style="
            display: flex;
            gap: var(--space-6);
            align-items: center;
            opacity: 0;
          ">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="16" fill="var(--color-accent)" />
              <path d="M16 26 L24 34 L36 18" stroke="var(--color-bg)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="16" fill="var(--color-teal)" />
              <circle cx="26" cy="22" r="8" stroke="var(--color-bg)" stroke-width="3.5" fill="none" />
              <path d="M18 38 C18 32 34 32 34 38" stroke="var(--color-bg)" stroke-width="3.5" stroke-linecap="round" fill="none" />
            </svg>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect width="52" height="52" rx="16" fill="var(--color-amber)" />
              <path d="M26 14 L30 22 L38 23 L32 29 L33.5 37 L26 33 L18.5 37 L20 29 L14 23 L22 22 Z" fill="var(--color-bg)" />
            </svg>
          </div>

          <h1 data-ref="heading" style="
            font-family: var(--font-display);
            font-size: var(--text-4xl);
            font-weight: 800;
            line-height: 1.15;
            margin: 0;
            color: var(--color-fg);
            opacity: 0;
          ">Ideas that move<br>people forward</h1>

          <p data-ref="body" style="
            font-family: var(--font-body);
            font-size: var(--text-xl);
            line-height: 1.7;
            color: var(--color-muted);
            max-width: 540px;
            margin: 0;
            opacity: 0;
          ">Warm illustrations, friendly type, and generous motion turn complex topics into stories your audience wants to follow.</p>

          <!-- Pill badges -->
          <div data-ref="pills" style="
            display: flex;
            gap: var(--space-3);
            flex-wrap: wrap;
            justify-content: center;
            opacity: 0;
          ">
            <span style="
              font-family: var(--font-display);
              font-size: var(--text-sm);
              font-weight: 600;
              background: var(--color-accent);
              color: var(--color-bg);
              padding: var(--space-2) var(--space-6);
              border-radius: var(--radius-full);
            ">Illustrative</span>
            <span style="
              font-family: var(--font-display);
              font-size: var(--text-sm);
              font-weight: 600;
              background: var(--color-teal);
              color: var(--color-bg);
              padding: var(--space-2) var(--space-6);
              border-radius: var(--radius-full);
            ">Motion-rich</span>
            <span style="
              font-family: var(--font-display);
              font-size: var(--text-sm);
              font-weight: 600;
              background: var(--color-amber);
              color: var(--color-bg);
              padding: var(--space-2) var(--space-6);
              border-radius: var(--radius-full);
            ">Approachable</span>
          </div>
        </div>
      </div>
    `;
	},

	async play(ctx) {
		const q = (sel: string) => host?.querySelector(`[data-ref="${sel}"]`) as HTMLElement | null;

		const blob1 = q("blob-1");
		const blob2 = q("blob-2");
		const blob3 = q("blob-3");
		const blob4 = q("blob-4");
		const blob5 = q("blob-5");
		const card = q("card");
		const iconGroup = q("icon-group");
		const heading = q("heading");
		const body = q("body");
		const pills = q("pills");

		const bounce = {
			easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
			fill: "forwards" as const,
		};
		const soft = {
			easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			fill: "forwards" as const,
		};

		// All animations use WAAPI delay for staggering (render-safe)

		// --- Phase 1: Background shapes pop in with scale + rotation ---
		blob1?.animate(
			[
				{ opacity: 0, transform: "scale(0)" },
				{ opacity: 0.18, transform: "scale(1)" },
			],
			{ ...bounce, duration: 600 },
		);

		blob3?.animate(
			[
				{ opacity: 0, transform: "rotate(-12deg) scale(0)" },
				{ opacity: 0.15, transform: "rotate(6deg) scale(1)" },
			],
			{ ...bounce, duration: 650, delay: 100 },
		);

		blob2?.animate(
			[
				{ opacity: 0, transform: "scale(0)" },
				{ opacity: 0.16, transform: "scale(1)" },
			],
			{ ...bounce, duration: 600, delay: 180 },
		);

		blob5?.animate(
			[
				{ opacity: 0, transform: "rotate(8deg) scale(0)" },
				{ opacity: 0.12, transform: "rotate(-4deg) scale(1)" },
			],
			{ ...bounce, duration: 550, delay: 180 },
		);

		blob4?.animate(
			[
				{ opacity: 0, transform: "scale(0)" },
				{ opacity: 0.2, transform: "scale(1)" },
			],
			{ ...bounce, duration: 600, delay: 260 },
		);

		// --- Phase 2: Card enters with bounce scale ---
		card?.animate(
			[
				{ opacity: 0, transform: "scale(0.88) translateY(24px)" },
				{ opacity: 1, transform: "scale(1) translateY(0)" },
			],
			{ ...bounce, duration: 700, delay: 460 },
		);

		// --- Phase 3: Content stagger inside the card ---

		// Icon cluster pops in
		iconGroup?.animate(
			[
				{ opacity: 0, transform: "scale(0.5) translateY(12px)" },
				{ opacity: 1, transform: "scale(1) translateY(0)" },
			],
			{ ...bounce, duration: 600, delay: 860 },
		);

		// Headline slides up
		heading?.animate(
			[
				{ opacity: 0, transform: "translateY(32px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...soft, duration: 550, delay: 1040 },
		);

		// Body text follows
		body?.animate(
			[
				{ opacity: 0, transform: "translateY(24px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...soft, duration: 500, delay: 1200 },
		);

		// Pill badges bounce in
		pills?.animate(
			[
				{ opacity: 0, transform: "scale(0.7) translateY(16px)" },
				{ opacity: 1, transform: "scale(1) translateY(0)" },
			],
			{ ...bounce, duration: 600, delay: 1400 },
		);

		await ctx.waitForNext(); // Beat 1: full composition revealed
	},

	unmount() {
		host = null;
	},
});
