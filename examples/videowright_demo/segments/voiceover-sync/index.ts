import { defineSegment } from "videowright";

let host: HTMLElement | null = null;

const SCRIPT_LINES = [
	"## cold-open",
	"Everything you're about to watch — including the terminal you just saw — was made by Videowright.",
	"",
	"## title-card",
	"Videowright turns a coding agent into a video team.",
	"",
	"## web-tech-gallery",
	"SVG. Charting libraries. Advanced 3D and motion.",
	"Even your real product UI, rendered from your own React components.",
	"",
	"## voiceover-sync",
	"Your script generates the narration. The narration drives the timing.",
	"Edit a line — everything re-syncs.",
];

const ACTIVE_LINE_INDEX = 11; // "Your script generates the narration..."
const EDITED_LINE_INDEX = 12; // "Edit a line — everything re-syncs."

export default defineSegment({
	id: "voiceover-sync",
	advances: [13.0],
	voiceover:
		"Your script generates the narration. The narration drives the timing. Edit a line — everything re-syncs.",

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
          background:
            linear-gradient(var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px,
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 64px 64px;
        "></div>

        <div style="
          position: absolute;
          left: var(--safe-x); right: var(--safe-x);
          top: var(--safe-y); bottom: 100px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
        ">
          <!-- Left: script.md -->
          <div style="
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            display: flex; flex-direction: column;
            overflow: hidden;
          ">
            <div style="
              padding: 12px 18px;
              background: #131c25;
              border-bottom: 1px solid var(--color-border);
              font-family: var(--font-mono); font-size: 12px;
              color: var(--color-muted);
              display: flex; gap: 16px;
              letter-spacing: 0.08em;
            ">
              <span style="color: var(--color-accent);">⌬</span>
              <span>voiceover/script.md</span>
              <span style="margin-left: auto;" data-ref="dirty"></span>
            </div>
            <div data-ref="script" style="
              flex: 1;
              padding: 24px 28px;
              font-family: var(--font-mono);
              font-size: 18px;
              line-height: 1.7;
              overflow: hidden;
              color: var(--color-muted);
            "></div>
          </div>

          <!-- Right: animation preview -->
          <div style="
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            display: flex; flex-direction: column;
            overflow: hidden;
          ">
            <div style="
              padding: 12px 18px;
              background: #131c25;
              border-bottom: 1px solid var(--color-border);
              font-family: var(--font-mono); font-size: 12px;
              color: var(--color-muted);
              letter-spacing: 0.08em;
            ">
              <span style="color: var(--color-accent);">▶</span>
              <span style="margin-left: 8px;">PREVIEW · t = <span data-ref="t-readout">00.00</span>s</span>
              <span style="margin-left: auto; float: right;" data-ref="resync">SYNCED ✓</span>
            </div>
            <div data-ref="preview" style="
              flex: 1;
              padding: 32px;
              display: flex; flex-direction: column; gap: 18px;
              align-items: center; justify-content: center;
            ">
              <div data-ref="anim-title" style="
                font-family: var(--font-display);
                font-size: 48px;
                font-weight: 500;
                opacity: 0;
              ">Your narration</div>
              <div data-ref="anim-bar" style="
                width: 80%; height: 4px;
                background: var(--color-border);
                position: relative;
                overflow: hidden;
              ">
                <div data-ref="anim-fill" style="
                  position: absolute; left: 0; top: 0; height: 100%;
                  width: 0%;
                  background: var(--color-accent);
                "></div>
              </div>
              <div data-ref="anim-caption" style="
                font-family: var(--font-mono);
                font-size: 14px;
                color: var(--color-muted);
                letter-spacing: 0.1em;
                opacity: 0;
              ">DRIVES TIMING</div>
            </div>
          </div>
        </div>

        <div style="
          position: absolute; left: var(--safe-x); right: var(--safe-x); bottom: 28px;
          display: flex; gap: 32px;
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.1em;
        ">
          <span>BEAT 04B</span>
          <span>SCRIPT → TIMING</span>
          <span style="margin-left: auto;">META-MOMENT</span>
        </div>
      </div>
    `;

		// Render the script lines, each in its own span
		const script = el.querySelector('[data-ref="script"]') as HTMLElement;
		SCRIPT_LINES.forEach((line, idx) => {
			const row = document.createElement("div");
			row.setAttribute("data-line", String(idx));
			row.style.cssText = `
        padding: 2px 8px;
        border-left: 2px solid transparent;
        white-space: pre-wrap;
        ${line.startsWith("##") ? "color: var(--color-accent); font-weight: 500; margin-top: 8px;" : ""}
      `;
			row.textContent = line || " ";
			script.appendChild(row);
		});
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const lines = host?.querySelectorAll(
			"[data-line]",
		) as NodeListOf<HTMLElement>;
		const tReadout = host?.querySelector(
			'[data-ref="t-readout"]',
		) as HTMLElement;
		const animTitle = host?.querySelector(
			'[data-ref="anim-title"]',
		) as HTMLElement;
		const animFill = host?.querySelector(
			'[data-ref="anim-fill"]',
		) as HTMLElement;
		const animCaption = host?.querySelector(
			'[data-ref="anim-caption"]',
		) as HTMLElement;
		const resync = host?.querySelector('[data-ref="resync"]') as HTMLElement;
		const dirty = host?.querySelector('[data-ref="dirty"]') as HTMLElement;

		// t-readout ticker
		const tickerStart = ctx.clock();
		const ticker = setInterval(() => {
			if (ctx.signal.aborted) return;
			const t = (ctx.clock() - tickerStart) / 1000;
			tReadout.textContent = t.toFixed(2).padStart(5, "0");
		}, 50);
		ctx.signal.addEventListener("abort", () => clearInterval(ticker));

		// Reveal everything
		animTitle.animate(
			[
				{ opacity: 0, transform: "translateY(8px)" },
				{ opacity: 1, transform: "translateY(0)" },
			],
			{ ...opts, duration: 400 },
		);
		animCaption.animate([{ opacity: 0 }, { opacity: 1 }], {
			...opts,
			duration: 360,
			delay: 200,
		});

		const highlightLine = (idx: number, color = "var(--color-accent)") => {
			lines.forEach((l, i) => {
				if (i === idx) {
					l.style.background = "rgba(255, 136, 0, 0.12)";
					l.style.borderLeftColor = color;
					l.style.color = "var(--color-fg)";
				} else if (!SCRIPT_LINES[i].startsWith("##")) {
					l.style.background = "transparent";
					l.style.borderLeftColor = "transparent";
					l.style.color = "var(--color-muted)";
				}
			});
		};

		// Walk earlier sections briefly
		for (const idx of [1, 4, 7, 8]) {
			highlightLine(idx);
			await ctx.hold(700);
		}

		// Land on the active VO line
		highlightLine(ACTIVE_LINE_INDEX);
		animFill.animate([{ width: "0%" }, { width: "65%" }], {
			...opts,
			duration: 2200,
		});
		await ctx.hold(2400);

		// Meta-moment: edit a line
		const editedLine = lines[EDITED_LINE_INDEX];
		dirty.textContent = "● modified";
		dirty.style.color = "var(--warn)";

		// Show cursor on the line
		const originalText = editedLine.textContent || "";
		// "Re-type" the line slightly differently
		const newText = "Edit a line — everything re-syncs in real time.";
		for (let i = originalText.length; i >= 0; i--) {
			if (ctx.signal.aborted) return;
			editedLine.textContent = originalText.slice(0, i);
			await ctx.hold(12);
		}
		for (let i = 0; i <= newText.length; i++) {
			if (ctx.signal.aborted) return;
			editedLine.textContent = newText.slice(0, i);
			await ctx.hold(22);
		}

		highlightLine(EDITED_LINE_INDEX);

		// Re-sync indicator
		resync.style.color = "var(--warn)";
		resync.textContent = "RE-SYNCING…";
		await ctx.hold(700);

		// Animation shifts/extends
		animFill.animate([{ width: "65%" }, { width: "100%" }], {
			...opts,
			duration: 600,
		});
		animTitle.animate(
			[
				{ transform: "translateY(0)", opacity: 1 },
				{ transform: "translateY(-3px)", opacity: 1 },
				{ transform: "translateY(0)", opacity: 1 },
			],
			{ duration: 600, easing: ease },
		);
		dirty.textContent = "";
		resync.style.color = "var(--color-accent)";
		resync.textContent = "SYNCED ✓";

		await ctx.hold(2200);
		clearInterval(ticker);
	},

	unmount() {
		host = null;
	},
});
