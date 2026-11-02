import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { release, showHud } from "../../components/v2/hud.js";
import { css, ms, svg, tidy } from "../../components/v2/motion.js";
import { FPS, frameCount, videoSeconds } from "../../components/v2/program.js";
import { type Stage, createStage, startAmbient } from "../../components/v2/stage.js";
import { createTitleLockup } from "../../components/v2/title-lockup.js";
import { charsAt, typeSchedule } from "../../components/v2/typing.js";

// Beat 5: one command. A shell in the project types the render command, and the CLI's
// progress bar runs the frame counter up to this video's real frame count while the voice
// says "deterministic"; the file is written. On "pixel-perfect" it opens: a player zooms out
// of its name, paused at 00:00 on the title card (the same component as beats 2 and 4, a third
// time). On "not a screen capture" the camera leans in and the render reads out under it.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [1.217, 3.65, 5.317, 7.917];
const CUE = { enter: 0, open: 1, frame: 2, exit: 3 } as const;
/** Seconds of window `i` (from the previous advance, or the segment start). */
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;

const PROMPT = "~/videowright_demo $ ";
const COMMAND = "npx videowright render";
/** The CLI's default output file (no --output). */
const FILE = "output.mp4";
const FRAMES = frameCount();
/** The progress bar's cells (the CLI caps its bar at 50; 40 fits this window). */
const BAR = 40;

/**
 * The shell window (stage px), centred on the frame, and its row grid: JetBrains Mono 34px,
 * 0.6em advance.
 */
const SHELL = { x: 160, y: 340, w: 1600, h: 380, font: 34, row: 54, left: 40, top: 76 } as const;
const rowTop = (r: number) => SHELL.top + r * SHELL.row;
/** The player window: a 1024 × 576 frame (the video at 8/15 scale), title bar, controls. */
const PLAYER = { x: 448, y: 176, w: 1024, frame: 576, bar: 48, controls: 60 } as const;
const PLAYER_H = PLAYER.bar + PLAYER.frame + PLAYER.controls;

const mmss = (s: number) =>
	`${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const thousands = (n: number) => n.toLocaleString("en-US");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let host: HTMLElement | null = null;
let stage: Stage;
let shell: HTMLElement;
let rows: HTMLElement[];
let player: HTMLElement;

function progressLine(done: number): string {
	const p = done / FRAMES;
	const filled = Math.round(p * BAR);
	const pct = String(Math.round(p * 100)).padStart(3);
	return `[${"█".repeat(filled)}${"░".repeat(BAR - filled)}] ${pct}%  frame ${String(done).padStart(4)} / ${FRAMES}`;
}

/** A neutral-dark shell window on the agent pane's palette (v2.css .v2-pane). */
function createShell(parent: HTMLElement): { root: HTMLElement; rows: HTMLElement[] } {
	const root = document.createElement("div");
	root.className = "v2-pane";
	root.style.cssText = `left:${SHELL.x}px; top:${SHELL.y}px; width:${SHELL.w}px; height:${SHELL.h}px; font-size:${SHELL.font}px; line-height:${SHELL.row}px`;
	root.innerHTML = `
		<div class="v2-pane-bar">
			<span class="v2-term-dot" style="left:22px; top:17px"></span>
			<span class="v2-term-dot" style="left:44px; top:17px"></span>
			<span class="v2-term-dot" style="left:66px; top:17px"></span>
			<div class="v2-term-title" style="line-height:48px">videowright_demo — zsh</div>
		</div>`;
	parent.appendChild(root);
	const rowEls = [0, 1, 2, 3, 4].map((r) => {
		const el = document.createElement("div");
		el.className = "v2-pane-row";
		el.style.cssText = `left:${SHELL.left}px; top:${rowTop(r)}px; height:${SHELL.row}px`;
		root.appendChild(el);
		return el;
	});
	return { root, rows: rowEls };
}

/** The prompt line, with `typed` characters of the command and (optionally) the caret. */
const promptLine = (typed: string, caret: boolean) =>
	`<span class="v2-dim">${esc(PROMPT)}</span><span class="v2-bold" style="font-weight:500">${esc(typed)}</span>${caret ? '<span class="v2-caret" style="width:20px; height:42px; vertical-align:-10px"></span>' : ""}`;

/** The exported file in a dark player window: paused at 00:00 on the title card. */
function createPlayer(parent: HTMLElement): HTMLElement {
	const root = document.createElement("div");
	root.className = "v2-browser v2-browser-dark";
	root.style.cssText = `left:${PLAYER.x}px; top:${PLAYER.y}px; width:${PLAYER.w}px; height:${PLAYER_H}px; visibility:hidden; box-shadow: var(--elev-3)`;
	root.innerHTML = `
		<div class="v2-browser-bar" style="height:${PLAYER.bar}px">
			<span class="v2-browser-dot" style="left:22px; top:17px"></span>
			<span class="v2-browser-dot" style="left:44px; top:17px"></span>
			<span class="v2-browser-dot" style="left:66px; top:17px"></span>
			<div style="position:absolute; left:0; right:0; top:0; line-height:${PLAYER.bar}px; text-align:center; font-size:24px; font-weight:500; color:var(--browser-text)">${FILE}</div>
		</div>
		<div data-ref="frame" style="position:absolute; left:0; top:${PLAYER.bar}px; width:${PLAYER.w}px; height:${PLAYER.frame}px; overflow:hidden; background:#000"></div>
		<div style="position:absolute; left:0; right:0; top:${PLAYER.bar + PLAYER.frame}px; height:${PLAYER.controls}px; display:flex; align-items:center; gap:22px; padding:0 24px; box-sizing:border-box; background:var(--browser-bar); border-top:1px solid var(--browser-edge); font-family:var(--font-mono); font-size:24px; color:var(--browser-text)">
			<svg width="22" height="26" viewBox="0 0 22 26"><path d="M2 2L20 13L2 24Z" fill="currentColor"/></svg>
			<div style="position:relative; flex:1; height:6px; border-radius:3px; background:#3a3d43">
				<div style="position:absolute; left:-8px; top:-7px; width:20px; height:20px; border-radius:50%; background:#f4f4f6"></div>
			</div>
			<span style="white-space:nowrap">00:00 / ${mmss(videoSeconds())}</span>
		</div>`;
	parent.appendChild(root);
	// The title card's first settled frame: the beat-2 stage and lockup, at the player's scale.
	const canvas = document.createElement("div");
	canvas.style.cssText = `position:absolute; left:0; top:0; width:1920px; height:1080px; transform-origin:0 0; transform:scale(${PLAYER.w / 1920})`;
	(root.querySelector('[data-ref="frame"]') as HTMLElement).appendChild(canvas);
	const card = createStage(canvas, { key: { x: 940, y: 510 }, scanPhase: 1800 });
	card.root.insertAdjacentHTML(
		"beforeend",
		'<div class="me-hud"><div class="me-frame"></div></div>',
	);
	createTitleLockup(card.content).showFinal();
	return root;
}

export default defineSegment({
	id: "v2-pixel-perfect-export",
	advances: [1.217, 3.65, 5.317, 7.917],
	voiceover:
		"One command exports your video. It's deterministic, pixel-perfect rendering. Not a screen capture.",
	notes:
		"Entered on me-sweep. The command types from frame 1 ('One command exports'). Advances, each 0.15s before its word: 'your' (Enter: the render runs through 'deterministic'), 'pixel-perfect' (the player opens on the title card), 'not' (the camera leans in, the render reads out), exit before 'Your'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 960, y: 500 }, scanPhase: 4400 });
		// The camera pivots on the player's centre, where the beat ends up.
		stage.setOrigin(PLAYER.x + PLAYER.w / 2, PLAYER.y + PLAYER_H / 2);
		({ root: shell, rows } = createShell(stage.content));
		rows[0].innerHTML = promptLine("", true);
		player = createPlayer(stage.content);

		showHud(el, {
			beat: 5,
			total: 8,
			section: "Export",
			// The sweep's beam passes the HUD's left slots early in its run.
			delay: 140,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const { signal } = ctx;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// ── The command types (from frame 1, under the sweep): "One command exports" ──
		// Enter is cued on "your", not "exports": the command types under "One command
		// exports" and the render runs under "your video. It's deterministic".
		const typeStart = amb.now();
		const keys = typeSchedule(
			COMMAND,
			typeStart + span(CUE.enter) * 0.06,
			typeStart + span(CUE.enter) * 0.82,
			5,
		);
		let entered = false;
		let typed = -1;
		amb.add((t) => {
			if (entered) return false;
			const n = charsAt(keys, t);
			if (n !== typed) {
				typed = n;
				rows[0].innerHTML = promptLine(COMMAND.slice(0, n), true);
			}
			return true;
		});

		await ctx.waitForNext();
		// ── Enter ("your video"): the render runs, paced to end just before the file opens ──
		entered = true;
		rows[0].innerHTML = promptLine(COMMAND, false);
		const window1 = span(CUE.open);
		const enteredAt = amb.now();
		const runFrom = enteredAt + window1 * 0.08;
		const runTo = enteredAt + window1 * 0.84;
		const doneAt = enteredAt + window1 * 0.88;
		setTimeout(() => {
			if (signal.aborted) return;
			rows[1].innerHTML = '<span class="v2-dim">Starting render... this may take a while.</span>';
		}, 60);
		// The counter ticks on the --dur-tick grid, linear like a render's progress.
		const step = ms("--dur-tick") || 50;
		let shown = -1;
		amb.add((t) => {
			if (t < runFrom) return true;
			const stepped = Math.floor(tidy(t - runFrom) / step) * step;
			const done = Math.min(FRAMES, Math.round((FRAMES * stepped) / (runTo - runFrom)));
			if (done !== shown) {
				shown = done;
				rows[2].innerHTML = `<span class="v2-dim">${progressLine(done)}</span>`;
			}
			return done < FRAMES;
		});
		setTimeout(() => {
			if (signal.aborted) return;
			rows[3].innerHTML = `<span class="v2-ok">✓</span> wrote <span class="v2-bold" data-ref="file">${FILE}</span>`;
			rows[4].innerHTML = promptLine("", true);
		}, doneAt - amb.now());

		await ctx.waitForNext();
		// ── "pixel-perfect rendering": the file opens, paused at 00:00 on the title card ──
		const file = rows[3].querySelector('[data-ref="file"]') as HTMLElement | null;
		const from = {
			x: SHELL.x + SHELL.left + (file ? file.offsetLeft + file.offsetWidth / 2 : 600),
			y: SHELL.y + rowTop(3) + SHELL.row / 2,
		};
		player.style.visibility = "";
		player.style.transformOrigin = `${from.x - PLAYER.x}px ${from.y - PLAYER.y}px`;
		player.animate([{ transform: "scale(0.04)" }, { transform: "none" }], {
			duration: ms("--dur-slow"),
			easing: css("--ease-settle"),
			fill: "both",
		});
		// The opacity is a short linear ramp; the settle rides on the transform alone.
		player.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: "both" });
		// Focus shifts to the player: the shell fades out entirely, so the player and its frames
		// readout are the only subject.
		shell.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: ms("--dur-normal"),
			easing: css("--ease-exit"),
			fill: "forwards",
		});

		await ctx.waitForNext();
		// ── "Not a screen capture": the camera leans in; the render reads out under the frame ──
		amb.nudge(0.02, 1200);
		const tag = svg(s, "text", {
			x: PLAYER.x,
			y: PLAYER.y + PLAYER_H + 46,
			fill: "var(--cyan)",
			class: "me-readout",
			style: "font-size: var(--type-mono)",
		});
		tag.textContent = `${thousands(FRAMES)} FRAMES · 1920 × 1080 · ${FPS} FPS`;
		tag.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: ms("--dur-normal"), delay: 260, easing: css("--ease-settle"), fill: "both" },
		);

		// Release before the exit: the readout lets go, the camera rests.
		const out = ms("--dur-exit");
		await ctx.hold(Math.max(0, span(CUE.exit) - out * 1.6));
		release([], [tag]);
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		host = null;
	},
});
