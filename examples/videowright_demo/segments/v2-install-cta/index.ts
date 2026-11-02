import { defineSegment } from "videowright";
import { typedLines, wrapSpans } from "../../components/v2/agent.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { showHud } from "../../components/v2/hud.js";
import { type Mark, createMark, createWordmark, drawMark } from "../../components/v2/logo.js";
import {
	AGENTS_SCAN_PHASE,
	END_CARD_BOX,
	END_CARD_KEY,
	END_CARD_SHIFT,
	matchOutline,
} from "../../components/v2/match.js";
import { css, ms, riseIn } from "../../components/v2/motion.js";
import { startOf } from "../../components/v2/program.js";
import { SCAN_PERIOD, type Stage, createStage, startAmbient } from "../../components/v2/stage.js";
import { LOCKUP, WORDMARK_HIDDEN } from "../../components/v2/title-lockup.js";
import { charsAt, typeSchedule } from "../../components/v2/typing.js";

// Beat 8: the end card. It opens on the video's one match cut: the agents beat's outline has
// arrived on this beat's prompt box, which is up on frame 1 under the same outline (the grid
// scan and the key light carry across). The logo returns above it (the title card's lockup
// without its tagline) and the install prompt types into the box as the voice says it:
// "Install Videowright…", then the README's install path. On "You'll have a video…" the
// destination turns amber, and stays: the last frame is the takeaway (and the thumbnail). The
// line itself is the voice's alone. Then the frame holds, ambient only, for the take's 5.0s
// end hold after the last word: the timecode, the scan, the caret, the drift.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [3.35, 10.683];
const CUE = { close: 0, end: 1 } as const;
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;
const PROMPT = "Install Videowright using these instructions: github.com/scosman/videowright";

/** The design canvas's width (stage px). */
const FRAME_W = 1920;
/**
 * The logo: the title card's lockup at 65%, centred on the frame. Deviation from the Direction's
 * "logo lockup returns": the mark and wordmark return without the tagline, whose "Build videos
 * in Claude Code" would contradict the beat before ("works in every major coding agent").
 */
const K = 0.65;
const MARK = { left: 160, top: 160 + END_CARD_SHIFT, width: LOCKUP.mark.width * K };
const WORD = {
	left: MARK.left + (LOCKUP.wordmark.left - LOCKUP.mark.left) * K,
	top: MARK.top + (LOCKUP.wordmark.top - LOCKUP.mark.top) * K,
	size: LOCKUP.wordmark.size * K,
};
/** The agent's input box (stage px; the matched shape): JetBrains Mono 52px, 76px rows. */
const BOX = { ...END_CARD_BOX, font: 52, text: 104, row1: 100, rowH: 76 } as const;
const COL = BOX.font * 0.6;
/**
 * The ⏎ RETURN chip's 22px label shares a baseline with the 28px box label: with line-height 1
 * a label's baseline sits 0.834 em down its box (Archivo's ascent and descent), so the chip's
 * label box drops (28 − 22) × 0.834 ≈ 5px below the 28px label's top.
 */
const CHIP_DROP = 5;
/** The box label's top, and the chip's inset from its border box to its label (border + padding). */
const LABEL_TOP = 31;
const CHIP_INSET = 1 + 10;
const COLS = Math.floor((BOX.w - BOX.text - 40) / COL);

let host: HTMLElement | null = null;
let stage: Stage;
let mark: Mark;
let letters: HTMLElement[];
let box: HTMLElement;
let lines: HTMLElement[];
let caret: HTMLElement;
let outline: HTMLElement;

export default defineSegment({
	id: "v2-install-cta",
	advances: [3.35, 10.683],
	voiceover:
		"Install Videowright and ask your agent to build your video. You'll have a video, before your coffee is cold.",
	notes:
		"Entered on the match cut ('cut'). The prompt types from frame 1 ('Install Videowright…'). Advance 1: 0.15s before 'You'll', the destination turns amber. Advance 2: the end of the audio, the take's 5.0s end hold after 'cold.', held ambient only.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		// The grid scan runs on from the agents beat's, so the cut doesn't jump it.
		const agentsMs = (startOf("v2-install-cta") - startOf("v2-any-coding-agent")) * 1000;
		stage = createStage(el, {
			key: END_CARD_KEY,
			scanPhase: Math.round(AGENTS_SCAN_PHASE + agentsMs) % SCAN_PERIOD,
		});
		// The box spans the safe frame, so the ambient push pivots on the centre: a left pivot
		// would carry its right edge into the HUD band over the end hold.
		stage.setOrigin(960, 540);

		mark = createMark(MARK.width);
		mark.el.style.left = `${MARK.left}px`;
		mark.el.style.top = `${MARK.top}px`;
		stage.content.appendChild(mark.el);
		const word = document.createElement("div");
		word.style.cssText = `position:absolute; left:${WORD.left}px; top:${WORD.top}px`;
		const line = document.createElement("span");
		line.className = "me-line";
		// In px of the wordmark's size (an em would resolve against the wrapper's own size).
		line.style.paddingBottom = `${0.3 * WORD.size}px`;
		line.style.marginBottom = `${-0.3 * WORD.size}px`;
		const wordmark = createWordmark(WORD.size);
		wordmark.innerHTML = [...(wordmark.textContent ?? "")]
			.map((ch) => `<span>${ch}</span>`)
			.join("");
		line.appendChild(wordmark);
		word.appendChild(line);
		stage.content.appendChild(word);
		letters = [...wordmark.children] as HTMLElement[];
		for (const l of letters) {
			l.style.display = "inline-block";
			l.style.transform = WORDMARK_HIDDEN;
		}
		// The logo (mark and wordmark, one group) is centred on the frame, over the box (which
		// spans the safe frame, so shares that centre). Measured once the letters are laid out.
		const groupW = WORD.left - MARK.left + wordmark.offsetWidth;
		const shift = Math.round((FRAME_W - groupW) / 2 - MARK.left);
		mark.el.style.left = `${MARK.left + shift}px`;
		word.style.left = `${WORD.left + shift}px`;

		box = document.createElement("div");
		box.className = "me-panel";
		box.style.cssText = `position:absolute; left:${BOX.x}px; top:${BOX.y}px; width:${BOX.w}px; height:${BOX.h}px`;
		box.innerHTML = `
			<div class="me-label" style="position:absolute; left:40px; top:${LABEL_TOP}px; font-size:var(--type-mono); color:var(--fg-2)">Ask your coding agent</div>
			<div class="me-chip" style="position:absolute; right:32px; top:${LABEL_TOP + CHIP_DROP - CHIP_INSET}px"><span class="me-label" style="color:var(--fg-2)">⏎ Return</span></div>
			<div class="me-signal" style="position:absolute; left:40px; top:${BOX.row1}px; font-family:var(--font-mono); font-size:${BOX.font}px; line-height:${BOX.rowH}px">❯</div>
			${[0, 1]
				.map(
					(r) =>
						`<div data-ref="line-${r}" style="position:absolute; left:${BOX.text}px; top:${BOX.row1 + r * BOX.rowH}px; font-family:var(--font-mono); font-size:${BOX.font}px; font-weight:460; line-height:${BOX.rowH}px; color:var(--color-fg); white-space:pre"></div>`,
				)
				.join("")}`;
		stage.content.appendChild(box);
		// The matched outline, exactly where the agents beat's settled: it hands over to the
		// box's own border once the cut has landed.
		outline = matchOutline(stage.content, END_CARD_BOX);
		lines = [0, 1].map((r) => box.querySelector(`[data-ref="line-${r}"]`) as HTMLElement);
		caret = document.createElement("span");
		caret.style.cssText =
			"display:inline-block; width:4px; height:60px; margin-left:4px; vertical-align:-14px; background:var(--color-fg)";
		lines[0].appendChild(caret);

		showHud(el, {
			beat: 8,
			total: 8,
			section: "Install",
			// Entered on a cut: the readouts change with it.
			delay: 0,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const amb = startAmbient(ctx, stage);

		// ── The logo returns over the box and the prompt types, as the voice says it ──
		outline.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: ms("--dur-normal"),
			delay: 240,
			easing: css("--ease-exit"),
			fill: "forwards",
		});
		drawMark(mark, [0, 220, 440]);
		riseIn(letters, 300, ms("--dur-slow"), 18, WORDMARK_HIDDEN);
		const wrapped = wrapSpans(PROMPT, COLS);
		const w1 = span(CUE.close);
		const start = amb.now();
		const keys = typeSchedule(PROMPT, start, start + w1 * 0.88, 7);
		let shown = -1;
		amb.add((t) => {
			const n = charsAt(keys, t);
			if (n !== shown) {
				shown = n;
				const typed = typedLines(wrapped, n);
				wrapped.forEach((line, i) => {
					lines[i].textContent = line.text.slice(0, typed.shown[i]);
				});
				// The caret follows the last typed character onto the URL's line.
				lines[typed.caretLine].appendChild(caret);
			}
			return n < PROMPT.length;
		});
		// Solid while keys land, then a steady blink (the end hold's one moving mark in the box).
		caret.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 1060,
			delay: keys[keys.length - 1] - start + 500,
			easing: "steps(2, jump-none)",
			iterations: Number.POSITIVE_INFINITY,
		});

		await ctx.waitForNext();
		// ── "You'll have a video…": the destination becomes the signal, and stays so ──
		lines[1].animate([{ color: "var(--color-fg)" }, { color: "var(--amber)" }], {
			duration: 1,
			delay: 160,
			fill: "forwards",
		});
		// play() resolves; the ambient layer runs on until the final advance ends the video.
	},

	unmount() {
		host = null;
	},
});
