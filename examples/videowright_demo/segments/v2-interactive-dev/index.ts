import { defineSegment } from "videowright";
import { type AgentPane, createAgentPane } from "../../components/v2/agent.js";
import { type Browser, createBrowser } from "../../components/v2/browser.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { showHud } from "../../components/v2/hud.js";
import { css, ms } from "../../components/v2/motion.js";
import { type Stage, createStage, flare, startAmbient } from "../../components/v2/stage.js";
import { sweepReveal } from "../../components/v2/sweep.js";
import { tui } from "../../components/v2/terminal.js";
import { type TitleLockup, createTitleLockup } from "../../components/v2/title-lockup.js";
import { charsAt, typeSchedule } from "../../components/v2/typing.js";

// Beat 4: the live loop. Claude Code on the left, the dev server's preview on the right,
// still showing the first draft's off-brand title card. The request types in (the VO is
// saying it), the agent replies in one line, and on "reloads" the preview hot-reloads into the
// real title card: the same title-lockup component as beat 2, on the same stage, playing its
// reveal in miniature. Then the frame holds on the result.

/** This segment's advances (s): Enter on "and", the hot reload on "reloads", the exit. */
const ADV = [1.9, 2.95, 5.483];

const PROMPT = "update to new logo and style";
/**
 * The request types at a calm human pace: from TYPE_AT (as the split's left door passes the
 * input box), about KEY_MS a key with ±30% jitter, its last key at least ENTER_BEAT before
 * Enter ("and"). A window too short for that pace compresses the rhythm to fit (sub-beat
 * timing derives from the advance window).
 */
const KEY_MS = 52;
const TYPE_AT = 300;
const ENTER_BEAT = 100;
const RHYTHM = { jitter: 0.3, beat: 1.4, beatAfter: /\s/ };
/** The agent's one-line reply, then the hot reload's confirmation. */
const REPLY = "Updating title-card.ts…";

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

/** Transcript rows: the request, the reply, the confirmation, then the next prompt. */
const ROW = { input: 3, update: 5, status: 6, nextInput: 8 } as const;

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
	advances: [1.9, 2.95, 5.483],
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
		// The real title card, ready behind it: the beat-2 stage and lockup.
		const real = frameLayer(view);
		live = real.clip;
		live.style.visibility = "hidden";
		preview = createStage(real.canvas, { key: { x: 940, y: 510 }, scanPhase: 1800 });
		preview.root.insertAdjacentHTML(
			"beforeend",
			'<div class="me-hud"><div class="me-frame"></div></div>',
		);
		lockup = createTitleLockup(preview.content);

		showHud(el, {
			beat: 4,
			total: 8,
			section: "Live preview",
			// The split lands its line at 30%; the readouts change as the panes open.
			delay: 260,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);

		// ── The request types in ──
		const typeStart = amb.now() + TYPE_AT;
		const keys = typeSchedule(
			PROMPT,
			typeStart,
			Math.min(typeStart + (PROMPT.length - 1) * KEY_MS, amb.now() + ADV[0] * 1000 - ENTER_BEAT),
			3,
			RHYTHM,
		);
		let entered = false;
		amb.add((t) => {
			if (entered) return false;
			const chars = charsAt(keys, t);
			const lastKey = chars > 0 ? keys[chars - 1] : typeStart;
			pane.input.show(PROMPT, chars);
			// Solid while keys land, blinking once idle.
			const idle = t - lastKey;
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
		// The request moves into the transcript, echoed as Claude Code does; the agent replies.
		pane.line(ROW.input, tui.echo(PROMPT));
		pane.input.show("", 0);
		pane.input.setRow(ROW.nextInput);
		setTimeout(() => {
			if (!ctx.signal.aborted) pane.line(ROW.update, tui.say(REPLY));
		}, 220);
		pane.input.caret.style.opacity = "1";
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
		sweepReveal(browser.viewport, live, draft, FRAME, { axis: "y", duration: 460 });
		lockup.reveal();
		flare(stage, BROWSER.x + FRAME.x + FRAME.w / 2, BROWSER.y + 64 + FRAME.y + FRAME.h / 2, 120);

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
