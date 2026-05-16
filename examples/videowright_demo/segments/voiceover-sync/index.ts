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
	"Your script generates an AI narration. The pace of the narration drives the video timing.",
];

const ACTIVE_LINE_INDEX = 11; // "Your script generates an AI narration..."
const ADDED_LINE_TEXT = "Edit a line and the video re-syncs.";

// Timeline blocks shown on the right panel. Widths are seconds (proportional).
// The "voiceover-sync" block is the active one and grows when the line is edited.
type Block = { id: string; label: string; sec: number; active?: boolean };
const TIMELINE_BLOCKS: Block[] = [
	{ id: "cold-open", label: "cold-open", sec: 10.0 },
	{ id: "title-card", label: "title", sec: 4.5 },
	{ id: "gallery", label: "gallery", sec: 16.4 },
	{ id: "voiceover-sync", label: "voiceover-sync", sec: 7.3, active: true },
	{ id: "any-coding-agent", label: "agents", sec: 4.6 },
	{ id: "install-cta", label: "install", sec: 9.8 },
];
const EDITED_VOSYNC_SEC = 10.4; // grows after edit

export default defineSegment({
	id: "voiceover-sync",
	advances: [13.0],
	voiceover:
		"Your script generates an AI narration. The pace of the narration drives the video timing. Edit a line and the video re-syncs.",

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
          display: grid; grid-template-rows: 1fr 0.45fr; gap: 32px;
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

          <!-- Right: timeline preview -->
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
              <span style="margin-left: 8px;">TIMELINE · t = <span data-ref="t-readout">00.00</span>s</span>
              <span style="margin-left: auto; float: right;" data-ref="resync">SYNCED ✓</span>
            </div>
            <div data-ref="preview" style="
              flex: 1;
              padding: 32px 28px 28px;
              display: flex; flex-direction: column; gap: 18px;
              overflow: hidden;
            ">
              <!-- Ruler -->
              <div data-ref="ruler" style="
                position: relative;
                height: 20px;
                border-bottom: 1px solid var(--color-border);
                font-family: var(--font-mono);
                font-size: 10px;
                color: var(--color-muted);
              "></div>

              <!-- Track wrapper -->
              <div style="position: relative; flex: 1; min-height: 0;">
                <!-- Track of segment blocks -->
                <div data-ref="track" style="
                  display: flex; gap: 3px;
                  height: 64px;
                  align-items: stretch;
                "></div>
              </div>
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
			row.textContent = line || " ";
			script.appendChild(row);
		});

		// Build timeline blocks on the right panel
		const track = el.querySelector('[data-ref="track"]') as HTMLElement;
		const totalSec = TIMELINE_BLOCKS.reduce((s, b) => s + b.sec, 0);
		for (const b of TIMELINE_BLOCKS) {
			const cell = document.createElement("div");
			cell.setAttribute("data-block", b.id);
			cell.dataset.sec = String(b.sec);
			cell.style.cssText = `
        flex: ${b.sec} 0 0;
        min-width: 0;
        position: relative;
        background: ${b.active ? "rgba(255, 136, 0, 0.22)" : "rgba(255, 255, 255, 0.05)"};
        border: 1px solid ${b.active ? "var(--color-accent)" : "var(--color-border)"};
        border-radius: 3px;
        padding: 8px 10px;
        display: flex; flex-direction: column; justify-content: space-between;
        overflow: ${b.active ? "visible" : "hidden"};
        ${b.active ? "box-shadow: 0 0 14px rgba(255, 136, 0, 0.25);" : ""}
      `;
			cell.innerHTML = `
        <div style="
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.05em;
          color: ${b.active ? "var(--color-fg)" : "var(--color-muted)"};
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        ">${b.label}</div>
        <div data-block-sec style="
          font-family: var(--font-mono);
          font-size: 13px;
          letter-spacing: 0.02em;
          color: ${b.active ? "var(--color-accent)" : "var(--color-muted)"};
          font-weight: ${b.active ? "500" : "400"};
        ">${b.sec.toFixed(1)}s</div>
      `;
			track.appendChild(cell);
		}

		// Build ruler tick labels
		const ruler = el.querySelector('[data-ref="ruler"]') as HTMLElement;
		const ticks = [0, 10, 20, 30, 40, 50];
		for (const t of ticks) {
			const tickEl = document.createElement("div");
			const pct = (t / totalSec) * 100;
			tickEl.style.cssText = `
        position: absolute; left: ${pct}%; top: 0; bottom: 0;
        display: flex; flex-direction: column; align-items: flex-start;
        transform: translateX(-1px);
      `;
			tickEl.innerHTML = `
        <div style="width: 1px; height: 6px; background: var(--color-border);"></div>
        <div style="margin-top: 2px;">${t}s</div>
      `;
			ruler.appendChild(tickEl);
		}
	},

	async play(ctx) {
		const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
		const opts = { fill: "forwards" as const, easing: ease };

		const lines = host?.querySelectorAll("[data-line]") as NodeListOf<HTMLElement>;
		const tReadout = host?.querySelector('[data-ref="t-readout"]') as HTMLElement;
		const resync = host?.querySelector('[data-ref="resync"]') as HTMLElement;
		const dirty = host?.querySelector('[data-ref="dirty"]') as HTMLElement;
		const track = host?.querySelector('[data-ref="track"]') as HTMLElement;

		const activeBlock = track.querySelector('[data-block="voiceover-sync"]') as HTMLElement;
		const activeBlockSecEl = activeBlock.querySelector("[data-block-sec]") as HTMLElement;

		// Where the active block sits on the timeline as a % of total width.
		const totalSec = TIMELINE_BLOCKS.reduce((s, b) => s + b.sec, 0);
		const activeSec = TIMELINE_BLOCKS.find((b) => b.active)?.sec ?? 7.3;

		// t-readout ticker
		const tickerStart = ctx.clock();
		const ticker = setInterval(() => {
			if (ctx.signal.aborted) return;
			const t = (ctx.clock() - tickerStart) / 1000;
			tReadout.textContent = t.toFixed(2).padStart(5, "0");
		}, 50);
		ctx.signal.addEventListener("abort", () => clearInterval(ticker));

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
			await ctx.hold(250);
		}

		// Land on the active VO line
		highlightLine(ACTIVE_LINE_INDEX);
		await ctx.hold(250);

		// Meta-moment: ADD a new line to the script (rather than edit an existing
		// one). Reads more clearly as "the writer added content" → "the timeline
		// grew" than an in-place edit would.
		dirty.textContent = "● modified";
		dirty.style.color = "var(--warn)";

		const scriptEl = host?.querySelector('[data-ref="script"]') as HTMLElement;

		// Build the new line element in the same style as the rest of the script,
		// pre-highlighted as the focus line and starting empty.
		const newLineIdx = SCRIPT_LINES.length; // appended after existing entries
		const newRow = document.createElement("div");
		newRow.setAttribute("data-line", String(newLineIdx));
		newRow.style.cssText = `
      padding: 2px 8px;
      border-left: 2px solid var(--color-accent);
      white-space: pre-wrap;
      background: rgba(255, 136, 0, 0.12);
      color: var(--color-fg);
    `;
		// Caret element so the viewer sees where the new line is being added.
		const caret = document.createElement("span");
		caret.style.cssText = `
      display: inline-block; width: 8px; height: 18px;
      background: var(--color-accent);
      margin-left: 2px; vertical-align: middle;
      animation: blink 1s steps(2) infinite;
    `;
		const newRowText = document.createElement("span");
		newRow.appendChild(newRowText);
		newRow.appendChild(caret);
		scriptEl.appendChild(newRow);

		// Small style block for the caret blink (scoped to the segment via host)
		if (!host?.querySelector("style[data-vo-caret]")) {
			const styleEl = document.createElement("style");
			styleEl.setAttribute("data-vo-caret", "");
			styleEl.textContent = "@keyframes blink { 50% { opacity: 0; } }";
			host?.appendChild(styleEl);
		}

		// Type the new line in
		for (let i = 0; i <= ADDED_LINE_TEXT.length; i++) {
			if (ctx.signal.aborted) return;
			newRowText.textContent = ADDED_LINE_TEXT.slice(0, i);
			await ctx.hold(55);
		}
		// Drop the caret now that the line is "submitted"
		caret.style.display = "none";

		// Re-sync indicator (top-bar SYNCED ✓ → RE-SYNCING…)
		resync.style.color = "var(--warn)";
		resync.textContent = "RE-SYNCING…";
		await ctx.hold(600);

		// === Active block resizes (grows) — the key visual ===
		const oldSec = activeSec;
		const newSec = EDITED_VOSYNC_SEC;
		const delta = newSec - oldSec;

		// Floating "+N.Ns" delta badge anchored to the active block — makes the
		// length change unmistakable. Pops in alongside the resize animation.
		const deltaBadge = document.createElement("div");
		deltaBadge.style.cssText = `
      position: absolute;
      bottom: -14px; right: -16px;
      padding: 4px 10px;
      background: var(--color-accent);
      color: #0a0a0a;
      font-family: var(--font-mono);
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.02em;
      border-radius: 999px;
      box-shadow:
        0 0 0 2px var(--color-bg),
        0 6px 18px rgba(255, 136, 0, 0.55),
        0 0 24px rgba(255, 136, 0, 0.5);
      white-space: nowrap;
      opacity: 0;
      transform: scale(0.6);
      z-index: 3;
      pointer-events: none;
    `;
		deltaBadge.textContent = `+${delta.toFixed(1)}s`;
		activeBlock.appendChild(deltaBadge);
		deltaBadge.animate(
			[
				{ opacity: 0, transform: "scale(0.6)" },
				{ opacity: 1, transform: "scale(1.15)" },
				{ opacity: 1, transform: "scale(1)" },
			],
			{ duration: 800, easing: ease, fill: "forwards", delay: 180 },
		);

		// Animate the active block's flex-grow to its new seconds.
		// Other blocks share remaining space proportionally — they shrink slightly.
		activeBlock.animate([{ flexGrow: oldSec }, { flexGrow: newSec }], { ...opts, duration: 2000 });
		// Pulse glow on the resized block
		activeBlock.animate(
			[
				{ boxShadow: "0 0 14px rgba(255, 136, 0, 0.25)" },
				{ boxShadow: "0 0 28px rgba(255, 136, 0, 0.55)" },
				{ boxShadow: "0 0 14px rgba(255, 136, 0, 0.25)" },
			],
			{ duration: 2000, easing: ease },
		);

		// Tick up the seconds label as the block grows
		const labelStart = ctx.clock();
		const labelDur = 2000;
		const labelTick = () => {
			if (ctx.signal.aborted) return;
			const dt = ctx.clock() - labelStart;
			const t = Math.min(1, dt / labelDur);
			const e = 1 - (1 - t) ** 3;
			const cur = oldSec + (newSec - oldSec) * e;
			activeBlockSecEl.textContent = `${cur.toFixed(1)}s`;
			if (t < 1) requestAnimationFrame(labelTick);
			else activeBlockSecEl.textContent = `${newSec.toFixed(1)}s`;
		};
		requestAnimationFrame(labelTick);

		await ctx.hold(2100);

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
