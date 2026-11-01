import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { decode, hudProbe, registerOn, release, showHud } from "../../components/v2/hud.js";
import { css, ms, riseIn, svg, tidy } from "../../components/v2/motion.js";
import { frameCount, videoSeconds } from "../../components/v2/program.js";
import {
	type Box,
	type Stage,
	createStage,
	flare,
	startAmbient,
} from "../../components/v2/stage.js";
import { createTitleLockup } from "../../components/v2/title-lockup.js";
import { charsAt, typeSchedule } from "../../components/v2/typing.js";

// Beat 5: one command. A shell in the project types the render command, the CLI's progress
// bar runs the frame counter up to this video's real frame count, and the file is written.
// "Deterministic" is shown, not said: under the shell the HUD hashes the output as frames
// stream in, then a second run resolves to the same hash, group by group. On
// "pixel-perfect" the file opens: a player zooms out of its name, paused at 00:00 on the
// title card (the same component as beats 2 and 4, a third time), and the HUD locks onto
// its frame.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [1.22, 2.41, 3.65, 5.33, 7.521];
const CUE = { enter: 0, hash: 1, open: 2, frame: 3, exit: 4 } as const;
/** Seconds of window `i` (from the previous advance, or the segment start). */
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;

const PROMPT = "~/videowright_demo $ ";
const COMMAND = "npx videowright render --output explainer.mp4";
const FILE = "explainer.mp4";
const FRAMES = frameCount();
const HASH = "9F3C 7A21 E0B4 55D8 C2A9 31F0";
/** The progress bar's cells (the CLI caps its bar at 50; 40 fits this window). */
const BAR = 40;

/** The shell window (stage px) and its row grid: JetBrains Mono 34px, 0.6em advance. */
const SHELL = { x: 160, y: 190, w: 1600, h: 380, font: 34, row: 54, left: 40, top: 76 } as const;
const rowTop = (r: number) => SHELL.top + r * SHELL.row;
/** The hash comparison, under the shell, in readout-lg (56px mono, 0.6em advance). */
const HASHES = { x: 160, label: 636, run1: 686, run2: 786, hashX: 340, matchX: 1380 } as const;
const HASH_COL = 56 * 0.6;
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
let hashes: HTMLElement;
/** The hash rows' own annotation layer: under the player, so it recedes with the rows. */
let hashMarks: SVGSVGElement;
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
	const card = createStage(canvas, { key: { x: 940, y: 470 }, scanPhase: 1800 });
	card.root.insertAdjacentHTML(
		"beforeend",
		'<div class="me-hud"><div class="me-frame"></div></div>',
	);
	createTitleLockup(card.content, { labels: false }).showFinal();
	return root;
}

export default defineSegment({
	id: "v2-pixel-perfect-export",
	advances: [1.22, 2.41, 3.65, 5.33, 7.521],
	voiceover:
		"One command exports your video. It's deterministic, pixel-perfect rendering. Not a screen capture.",
	notes:
		"Entered on me-sweep. The command types from frame 1 ('One command exports'). Advances, each 0.15s before its word: 'your' (Enter: the render runs), 'It's' (run 2 hashes identically), 'pixel-perfect' (the player opens on the title card), 'not' (the HUD locks onto the frame), exit before 'Your'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 900, y: 420 }, scanPhase: 4400 });
		// The camera pivots on the player's centre, where the beat ends up.
		stage.setOrigin(PLAYER.x + PLAYER.w / 2, PLAYER.y + PLAYER_H / 2);
		({ root: shell, rows } = createShell(stage.content));
		rows[0].innerHTML = promptLine("", true);

		hashes = document.createElement("div");
		hashes.style.cssText = "position:absolute; inset:0";
		hashes.innerHTML = `
			<div class="me-label" style="position:absolute; left:${HASHES.x}px; top:${HASHES.label}px"><span class="me-line"><span data-ref="hash-label">SHA-256 · ${FILE}</span></span></div>
			${[1, 2]
				.map(
					(run) => `
				<div data-ref="run-${run}" style="position:absolute; left:${HASHES.x}px; top:${run === 1 ? HASHES.run1 : HASHES.run2}px; height:64px; width:${HASHES.matchX - HASHES.x}px">
					<span class="me-line" style="position:absolute; left:0; top:21px"><span class="me-label" style="color:var(--fg-2)">Run ${run}</span></span>
					<span class="me-readout-lg" data-ref="hash-${run}" style="position:absolute; left:${HASHES.hashX - HASHES.x}px; top:4px; color:var(--color-fg); white-space:pre"></span>
				</div>`,
				)
				.join("")}
			<span class="me-readout-lg" data-ref="match" style="position:absolute; left:${HASHES.matchX}px; top:${HASHES.run2 + 4}px; color:var(--ok); white-space:pre"></span>`;
		stage.content.appendChild(hashes);
		hashMarks = svg(hashes, "svg", {
			viewBox: "0 0 1920 1080",
			style:
				"position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none",
		});
		stage.ref("hash-label").style.transform = "translateY(112%)";
		for (const run of [1, 2]) {
			const row = stage.ref(`run-${run}`);
			(row.querySelector(".me-line > span") as HTMLElement).style.transform = "translateY(112%)";
		}
		player = createPlayer(stage.content);

		showHud(el, {
			beat: 5,
			total: 8,
			section: "Export",
			probe: "ZSH · ~/VIDEOWRIGHT_DEMO",
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
		// Enter is cued on "your", not "exports": 45 characters typed between "One" and
		// "exports" (~0.65s) would read as a paste. The render runs under "your video".
		const typeStart = amb.now();
		const keys = typeSchedule(
			COMMAND,
			typeStart + span(CUE.enter) * 0.04,
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
		// ── Enter ("your video"): the render runs, frames stream into the hash ──
		entered = true;
		rows[0].innerHTML = promptLine(COMMAND, false);
		const window1 = span(CUE.hash);
		const enteredAt = amb.now();
		const runFrom = enteredAt + window1 * 0.14;
		const runTo = enteredAt + window1 * 0.8;
		const doneAt = enteredAt + window1 * 0.86;
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
		const wroteDelay = doneAt - amb.now();
		setTimeout(() => {
			if (signal.aborted) return;
			rows[3].innerHTML = `<span class="v2-ok">✓</span> wrote <span class="v2-bold" data-ref="file">${FILE}</span>`;
			rows[4].innerHTML = promptLine("", true);
		}, wroteDelay);
		hudProbe(`RENDER · 60 FPS · ${thousands(FRAMES)} FRAMES`, 200, signal);

		// Run 1's hash rolls while frames are written, and resolves once the file is.
		riseIn([stage.ref("hash-label")], 120);
		riseIn([stage.ref("run-1").querySelector(".me-line > span") as HTMLElement], 200);
		// It starts rolling with its label and has resolved before run 2 starts.
		hashing(amb, stage.ref("hash-1"), runFrom + 40, doneAt - 150, 6);

		await ctx.waitForNext();
		// ── "It's deterministic": a second run resolves to the same hash, group by group ──
		const window2 = span(CUE.open);
		const hashAt = amb.now();
		riseIn([stage.ref("run-2").querySelector(".me-line > span") as HTMLElement], 0);
		// Run 2 resolves over the first half of the window, so the match (and its lock) has landed
		// by the end of "deterministic", before the file opens.
		const resolveAt = hashAt + window2 * 0.1;
		const perChar = Math.max(8, Math.round((window2 * 0.32) / HASH.length));
		const matchedAt = hashing(amb, stage.ref("hash-2"), hashAt + 40, resolveAt, perChar);
		// A cyan tie joins each group to run 1's once it has resolved to the same characters.
		const groups = HASH.split(" ");
		const ties = groups.map((group, g) => {
			const first = HASH.indexOf(group, g * 5);
			const cx = HASHES.hashX + (first + group.length / 2) * HASH_COL;
			const tie = svg(hashMarks, "path", {
				d: `M${cx - 44} ${HASHES.run1 + 70}H${cx + 44}M${cx} ${HASHES.run1 + 70}V${HASHES.run2 - 6}M${cx - 44} ${HASHES.run2 - 6}H${cx + 44}`,
				stroke: "var(--cyan)",
				"stroke-width": 2,
				fill: "none",
				opacity: 0,
			});
			const at = resolveAt + (first + group.length - 1) * perChar + 170 - amb.now();
			tie.animate(
				[
					{ opacity: 0, transform: "scaleY(0.2)" },
					{ opacity: 1, transform: "none" },
				],
				{ duration: ms("--dur-fast"), delay: at, easing: css("--ease-settle"), fill: "both" },
			);
			tie.style.transformBox = "fill-box";
			tie.style.transformOrigin = "50% 50%";
			return tie;
		});
		const match = stage.ref("match");
		decode(amb, match, "✓ MATCH", matchedAt + 40, { perChar: 18, signal });
		const rowsBox: Box = {
			x: HASHES.x - 12,
			y: HASHES.run1 - 8,
			w: HASHES.matchX + "✓ MATCH".length * HASH_COL - HASHES.x + 24,
			h: HASHES.run2 + 64 - HASHES.run1 + 16,
		};
		const hashLock = registerOn(hashMarks, rowsBox, matchedAt + 40 - amb.now(), 16);
		flare(
			stage,
			HASHES.hashX + 480,
			(HASHES.run1 + HASHES.run2) / 2 + 32,
			matchedAt + 160 - amb.now(),
		);
		hudProbe("2 RUNS · BIT-IDENTICAL", matchedAt + 200 - amb.now(), signal);

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
		// Focus shifts to the player: the shell and the hashes recede (dim and fall out of focus,
		// so the edges the player leaves uncovered read as background), the lock goes cyan.
		const recede = {
			duration: ms("--dur-normal"),
			easing: css("--ease-settle"),
			fill: "forwards" as const,
		};
		for (const el of [shell, hashes]) {
			el.animate(
				[{ filter: "brightness(1) blur(0px)" }, { filter: "brightness(0.36) blur(3px)" }],
				recede,
			);
		}
		for (const mark of hashLock) {
			mark.animate([{ stroke: "var(--amber)" }, { stroke: "var(--cyan)" }], recede);
		}
		hudProbe(`${FILE.toUpperCase()} · 00:00 / ${mmss(videoSeconds())}`, 300, signal);

		await ctx.waitForNext();
		// ── "Not a screen capture": the HUD locks onto the frame and reads out the render ──
		const frame: Box = { x: PLAYER.x, y: PLAYER.y + PLAYER.bar, w: PLAYER.w, h: PLAYER.frame };
		const frameLock = registerOn(s, frame, 0, 12, 48);
		amb.nudge(0.02, 1200);
		flare(stage, frame.x + frame.w / 2, frame.y + frame.h / 2, 260);
		const tag = svg(s, "text", {
			x: PLAYER.x,
			y: PLAYER.y + PLAYER_H + 46,
			fill: "var(--cyan)",
			class: "me-readout",
			style: "font-size: var(--type-mono)",
		});
		tag.textContent = `${thousands(FRAMES)} FRAMES · 1920 × 1080 · 60 FPS`;
		tag.animate(
			[
				{ opacity: 0, transform: "translateY(12px)" },
				{ opacity: 1, transform: "none" },
			],
			{ duration: ms("--dur-normal"), delay: 260, easing: css("--ease-settle"), fill: "both" },
		);
		hudProbe("RENDERED FRAME BY FRAME · 0 DROPPED", 400, signal);

		// Release before the exit: the corners let go, the camera rests.
		const out = ms("--dur-exit");
		await ctx.hold(Math.max(0, span(CUE.exit) - out * 1.6));
		release([], [...frameLock, tag]);
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		host = null;
	},
});

/**
 * A hash being computed: the row wipes in left to right from `rollFrom` (`enter` ms a
 * character, blanks holding each character's place so nothing reflows), every character
 * cycling through hashed noise; from `resolveAt` the characters settle left to right,
 * `perChar` ms apart (the HUD decode's rhythm), the rest still rolling. A pure function of the
 * clock (no Math.random). Returns when the last one settles (ticker ms).
 */
function hashing(
	ticker: { add(tick: (t: number) => boolean): void },
	el: HTMLElement,
	rollFrom: number,
	resolveAt: number,
	perChar: number,
): number {
	const NOISE = "0123456789ABCDEF";
	const settle = 170;
	const enter = 14;
	const end = resolveAt + (HASH.length - 1) * perChar + settle;
	// A mixed integer hash of (character, step): no runs or ramps across the row.
	const nib = (i: number, k: number) => {
		let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(k + 1, 0x85ebca6b);
		h ^= h >>> 15;
		h = Math.imul(h, 0x2c1b3c6d);
		h ^= h >>> 12;
		return NOISE[h >>> 28];
	};
	ticker.add((t) => {
		if (t < rollFrom) return true;
		const since = tidy(t - rollFrom);
		const k = Math.floor(since / 45);
		const local = tidy(t - resolveAt);
		el.textContent = [...HASH]
			.map((ch, i) => {
				if (ch === " " || since < i * enter) return " ";
				return local >= i * perChar + settle ? ch : nib(i, k);
			})
			.join("");
		return t < end;
	});
	return end;
}
