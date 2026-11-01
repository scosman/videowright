import { defineSegment } from "videowright";
import { type AgentPane, createAgentPane, wrapColumns } from "../../components/v2/agent.js";
import { type Browser, createBrowser } from "../../components/v2/browser.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { hudProbe, showHud } from "../../components/v2/hud.js";
import { css, ms, tidy } from "../../components/v2/motion.js";
import { type Stage, createStage, flare, startAmbient } from "../../components/v2/stage.js";
import { sweepReveal } from "../../components/v2/sweep.js";
import { spinnerGlyph, tui } from "../../components/v2/terminal.js";
import { type TitleLockup, createTitleLockup } from "../../components/v2/title-lockup.js";

// Beat 4: the live loop. Claude Code on the left, the dev server's preview on the right,
// still showing the first draft's off-brand title card. The request types in (the VO is
// saying it), the agent edits two files, and on "reloads" the preview hot-reloads into the
// real title card: the same title-lockup component as beat 2, on the same stage, playing its
// reveal in miniature. Then the frame holds on the result.

/** This segment's advances (s): Enter on "and", the hot reload on "reloads", the exit. */
const ADV = [1.9, 2.96, 5.785];

const PROMPT =
	"update the title card to our latest branding (name, tagline, design guide, colors), and add some motion";
/**
 * ms per typed character: the 103-character request must land between "Request" and "and"
 * (~1.8s), so it types fast. Phase 6 can widen the pause before "Request" if it reads rushed.
 */
const CHAR_MS = 16;
const TYPE_AT = 120;

/** The split: the agent pane ends left of it, the browser starts right of it. */
const SPLIT = 800;
const PANE = { x: 112, y: 128, w: 680, h: 824 } as const;
const BROWSER = { x: 808, y: 128, w: 992, h: 824 } as const;
/** The preview frame inside the browser viewport: the video at half scale. */
const FRAME = { x: 16, y: 64, w: 960, h: 540 } as const;
const PREVIEW_SCALE = FRAME.w / 1920;

/** The key light's pool: behind the agent, then behind the preview. */
const KEY_AGENT = { x: 460, y: 520 };
const KEY_BROWSER = { x: 1300, y: 500 };

/** Transcript rows. */
const ROW = { history: 3, input: 6, update: 11, status: 14, nextInput: 16 } as const;

let host: HTMLElement | null = null;
let stage: Stage;
let pane: AgentPane;
let browser: Browser;
let draft: HTMLElement;
let live: HTMLElement;
let preview: Stage;
let lockup: TitleLockup;

/** A 1920 x 1080 layer shown at the preview's scale, clipped to the frame. */
function frameLayer(parent: HTMLElement): { clip: HTMLElement; canvas: HTMLElement } {
	const clip = document.createElement("div");
	clip.style.cssText = `position:absolute; left:${FRAME.x}px; top:${FRAME.y}px; width:${FRAME.w}px; height:${FRAME.h}px; overflow:hidden`;
	const canvas = document.createElement("div");
	canvas.style.cssText = `position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:0 0; transform:scale(${PREVIEW_SCALE})`;
	clip.appendChild(canvas);
	parent.appendChild(clip);
	return { clip, canvas };
}

export default defineSegment({
	id: "v2-interactive-dev",
	advances: [1.9, 2.96, 5.785],
	voiceover: "Request changes in your coding agent, and the preview hot reloads.",
	notes:
		"Entered on me-split (its line is this scene's divider, data-split-x). The request types from frame 1 ('Request'). Advance 1: Enter, 0.15s before 'and'. Advance 2: the hot reload, 0.15s before 'reloads'. Advance 3: exit, 0.15s before the export beat's 'One'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: KEY_AGENT, scanPhase: 5200 });
		stage.root.dataset.splitX = String(SPLIT);

		// ── The agent: the session that made the video, still open ──
		pane = createAgentPane(stage.content, {
			...PANE,
			title: "videowright_demo — claude",
			cwd: "~/videowright_demo",
		});
		pane.line(ROW.history, tui.say("Video is ready. Preview:"));
		pane.line(ROW.history + 1, tui.code("npm run dev"), 2);
		pane.input.setRow(ROW.input);

		// ── The browser on the dev server, showing the draft ──
		browser = createBrowser(stage.content, {
			...BROWSER,
			url: "localhost:5173/video/demo_v2#/title-card/0",
			theme: "dark",
		});
		const view = browser.viewport;
		view.innerHTML = `
			<div class="v2-dev-bar">
				<span>Preview · title-card</span>
				<span data-ref="hmr" class="v2-dev-hmr"><i></i><span data-ref="hmr-text">HMR connected</span></span>
			</div>
			<div class="v2-dev-controls">
				<div class="v2-dev-track"><div style="width:22%"></div></div>
				${["cold-open", "title-card", "gallery", "live-dev"]
					.map(
						(name, i) =>
							`<span class="v2-dev-chip${i === 1 ? " on" : ""}">${String(i + 1).padStart(2, "0")} ${name}</span>`,
					)
					.join("")}
			</div>`;
		// The draft: plain, generic, off-brand.
		const off = frameLayer(view);
		draft = off.clip;
		off.canvas.innerHTML = `
			<div class="v2-draft">
				<div class="v2-draft-logo"></div>
				<div class="v2-draft-name">VideoRight</div>
				<div class="v2-draft-tag">Video Agent Tool</div>
			</div>`;
		// The real title card, ready behind it: the beat-2 stage and lockup, unlabelled at this
		// scale (its HUD labels would fall under the 22px floor on screen).
		const real = frameLayer(view);
		live = real.clip;
		live.style.visibility = "hidden";
		preview = createStage(real.canvas, { key: { x: 940, y: 470 }, scanPhase: 1800 });
		preview.root.insertAdjacentHTML(
			"beforeend",
			'<div class="me-hud"><div class="me-frame"></div></div>',
		);
		lockup = createTitleLockup(preview.content, { labels: false });

		showHud(el, {
			beat: 4,
			total: 8,
			section: "Live preview",
			probe: "LOCALHOST:5173 · VITE HMR",
			// The split lands its line at 30%; the readouts change as the panes open.
			delay: 260,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const { signal } = ctx;
		const amb = startAmbient(ctx, stage);
		const lines = wrapColumns(PROMPT, pane.input.cols);

		// ── The request types in ──
		const typeStart = amb.now() + TYPE_AT;
		let entered = false;
		let lastKey = 0;
		amb.add((t) => {
			if (entered) return false;
			const n = Math.min(PROMPT.length, Math.max(0, Math.floor(tidy(t - typeStart) / CHAR_MS) + 1));
			const chars = t < typeStart ? 0 : n;
			if (chars > 0) lastKey = typeStart + (chars - 1) * CHAR_MS;
			pane.input.show(lines, chars);
			// Solid while keys land, blinking once idle.
			const idle = t - Math.max(lastKey, typeStart);
			pane.input.caret.style.opacity =
				t < typeStart || idle < 400 || Math.floor((idle - 400) / 530) % 2 === 1 ? "1" : "0";
			return true;
		});
		// The key light sits behind the agent while the request types, then glides to the
		// preview when Claude starts work (a camera push would carry these near-full-width
		// windows into the HUD band).
		const key = stage.root.querySelector(".me-key") as HTMLElement;

		await ctx.waitForNext();
		// ── Enter ("and the preview…"): the request goes in, Claude edits the files ──
		entered = true;
		lines.forEach((text, i) => {
			pane.line(
				ROW.input + i,
				`<span class="v2-dim">${i === 0 ? "&gt; " : "  "}${esc(text)}</span>`,
			);
		});
		pane.input.show([""], 0);
		pane.input.setRow(ROW.nextInput);
		const enteredAt = amb.now();
		const update = ["Updating segments/title-card.ts,", "styles/tokens.css…"];
		setTimeout(() => {
			pane.line(ROW.update, tui.say(update[0]));
			pane.line(ROW.update + 1, update[1], 2);
		}, 220);
		let resolved = false;
		amb.add((t) => {
			if (resolved) return false;
			const since = t - enteredAt;
			if (since >= 380) {
				const secs = Math.floor(since / 1000) + 1;
				pane.line(ROW.status, tui.spinner(spinnerGlyph(since), "Hot-reloading…", `${secs}s`));
			}
			return true;
		});
		pane.input.caret.style.opacity = "1";
		hudProbe("EDIT · 2 FILES", 300, signal);
		// The eye goes to the preview: the key light glides over to the browser.
		key.animate(
			[
				{ backgroundPosition: `${KEY_AGENT.x - 700}px ${KEY_AGENT.y - 500}px` },
				{ backgroundPosition: `${KEY_BROWSER.x - 700}px ${KEY_BROWSER.y - 500}px` },
			],
			{ duration: 1400, easing: css("--ease-draw"), fill: "both" },
		);

		await ctx.waitForNext();
		// ── "reloads": hot update. The draft is swept away top to bottom and the real title
		// card plays its reveal, live, in the preview ──
		resolved = true;
		pane.line(ROW.status, '<span class="v2-ok">✓</span> Done. Hot-reloaded.');
		const hmr = browser.viewport.querySelector('[data-ref="hmr"]') as HTMLElement;
		(browser.viewport.querySelector('[data-ref="hmr-text"]') as HTMLElement).textContent =
			"hmr update · title-card.ts";
		hmr.animate(
			[
				{ color: "var(--ok)", transform: "translateY(-6px)" },
				{ color: "var(--ok)", transform: "none", offset: 0.15 },
				{ color: "var(--ok)", offset: 0.8 },
				{ color: "#8d9198" },
			],
			{ duration: 2400, easing: css("--ease-settle"), fill: "forwards" },
		);
		const swept = sweepReveal(browser.viewport, live, draft, FRAME, { axis: "y", duration: 460 });
		// The update lands: the preview's edge flashes cyan once, like the instrument confirming.
		const edge = document.createElement("div");
		edge.style.cssText = `position:absolute; left:${FRAME.x}px; top:${FRAME.y}px; width:${FRAME.w}px; height:${FRAME.h}px; pointer-events:none; box-shadow: inset 0 0 0 3px var(--cyan), inset 0 0 48px rgba(91, 216, 245, 0.28); opacity:0`;
		browser.viewport.appendChild(edge);
		edge.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }], {
			duration: 900,
			delay: swept - 80,
			easing: css("--ease-settle"),
			fill: "both",
		});
		lockup.reveal(amb);
		flare(stage, BROWSER.x + FRAME.x + FRAME.w / 2, BROWSER.y + 64 + FRAME.y + FRAME.h / 2, 120);
		hudProbe("HOT UPDATE · STATE KEPT", 200, signal);

		// Hold on the result; the ambient drift is back at rest before the exit.
		const restFor = ms("--dur-exit") * 1.4;
		await ctx.hold(Math.max(0, (ADV[2] - ADV[1]) * 1000 - restFor - 200));
		amb.rest(restFor);
		await ctx.hold(restFor);
	},

	unmount() {
		host = null;
	},
});

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
