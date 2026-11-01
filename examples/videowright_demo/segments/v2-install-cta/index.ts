import { defineSegment } from "videowright";
import { wrapColumns } from "../../components/v2/agent.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { hudProbe, registerOn, release, showHud } from "../../components/v2/hud.js";
import { type Mark, createMark, createWordmark, drawMark } from "../../components/v2/logo.js";
import { ms, riseIn } from "../../components/v2/motion.js";
import {
	type Stage,
	createStage,
	flare,
	panelIn,
	startAmbient,
} from "../../components/v2/stage.js";
import { LOCKUP } from "../../components/v2/title-lockup.js";
import { charsAt, typeSchedule } from "../../components/v2/typing.js";

// Beat 8: the end card. The logo returns (the title card's lockup without its tagline) and
// the install prompt types into a coding agent's input box as the voice says it: "Install
// Videowright…", then the README's install path. On "You'll have a video…" the closing line
// rises and the HUD locks onto the destination. Then the HUD lets go and the frame holds,
// ambient only, for END_HOLD after the last word: the timecode, the scan, the caret.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [3.34, 10.65];
const CUE = { close: 0, end: 1 } as const;
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;
/**
 * The calm hold after the last VO word (s). The final advance is that word's end plus this, so
 * the release lands as the hold begins: ADV[end] − END_HOLD is the end of "cold.".
 */
const END_HOLD = 5;

const PROMPT = "Install Videowright using these instructions: github.com/scosman/videowright";
const DESTINATION = "github.com/scosman/videowright";

/**
 * The logo: the title card's lockup at 65%, on the x = 160 line. Deviation from the Direction's
 * "logo lockup returns": the mark and wordmark return without the tagline, whose "Build videos
 * in Claude Code" would contradict the beat before ("works in every major coding agent").
 */
const K = 0.65;
const MARK = { left: 160, top: 160, width: LOCKUP.mark.width * K };
const WORD = {
	left: MARK.left + (LOCKUP.wordmark.left - LOCKUP.mark.left) * K,
	top: MARK.top + (LOCKUP.wordmark.top - LOCKUP.mark.top) * K,
	size: LOCKUP.wordmark.size * K,
};
/** The agent's input box (stage px): JetBrains Mono 52px (31.2px advance), 76px rows. */
const BOX = { x: 160, y: 404, w: 1600, h: 300, font: 52, text: 104, row1: 100, rowH: 76 } as const;
const COL = BOX.font * 0.6;
const COLS = Math.floor((BOX.w - BOX.text - 40) / COL);

let host: HTMLElement | null = null;
let stage: Stage;
let mark: Mark;
let letters: HTMLElement[];
let box: HTMLElement;
let lines: HTMLElement[];
let caret: HTMLElement;

export default defineSegment({
	id: "v2-install-cta",
	advances: [3.34, 10.65],
	voiceover:
		"Install Videowright and ask your agent to build your video. You'll have a video, before your coffee is cold.",
	notes:
		"Entered on me-push. The prompt types from frame 1 ('Install Videowright…'). Advance 1: 0.15s before 'You'll', the closing line rises and the HUD locks onto the URL. Advance 2: the end, 5.0s after 'cold.' ends (END_HOLD), held ambient only.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		stage = createStage(el, { key: { x: 760, y: 470 }, scanPhase: 5600 });
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
		line.style.paddingBottom = "0.3em";
		line.style.marginBottom = "-0.3em";
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
			l.style.transform = "translateY(112%)";
		}

		box = document.createElement("div");
		box.className = "me-panel";
		box.style.cssText = `position:absolute; left:${BOX.x}px; top:${BOX.y}px; width:${BOX.w}px; height:${BOX.h}px`;
		box.innerHTML = `
			<div class="me-label" style="position:absolute; left:40px; top:31px; font-size:var(--type-mono); color:var(--fg-2)">Ask your coding agent</div>
			<div class="me-chip" style="position:absolute; right:32px; top:20px"><span class="me-label" style="color:var(--fg-2)">⏎ Return</span></div>
			<div class="me-signal" style="position:absolute; left:40px; top:${BOX.row1}px; font-family:var(--font-mono); font-size:${BOX.font}px; line-height:${BOX.rowH}px">❯</div>
			${[0, 1]
				.map(
					(r) =>
						`<div data-ref="line-${r}" style="position:absolute; left:${BOX.text}px; top:${BOX.row1 + r * BOX.rowH}px; font-family:var(--font-mono); font-size:${BOX.font}px; font-weight:460; line-height:${BOX.rowH}px; color:var(--color-fg); white-space:pre"></div>`,
				)
				.join("")}`;
		stage.content.appendChild(box);
		lines = [0, 1].map((r) => box.querySelector(`[data-ref="line-${r}"]`) as HTMLElement);
		caret = document.createElement("span");
		caret.style.cssText =
			"display:inline-block; width:4px; height:60px; margin-left:4px; vertical-align:-14px; background:var(--color-fg)";
		lines[0].appendChild(caret);

		stage.content.insertAdjacentHTML(
			"beforeend",
			`<div class="me-body-lg" style="position:absolute; left:160px; top:772px; font-size:60px; color:var(--fg-2); white-space:nowrap">
				<span class="me-line"><span data-ref="closing">You'll have a video before your coffee is cold.</span></span>
			</div>`,
		);
		stage.ref("closing").style.transform = "translateY(112%)";

		showHud(el, {
			beat: 8,
			total: 8,
			section: "Install",
			probe: "README · INSTALL",
			// Lands with the push's arrival (it brings the new content in at 40%).
			delay: 280,
			signal: ctx.signal,
		});
	},

	async play(ctx) {
		if (!host) return;
		const { signal } = ctx;
		const amb = startAmbient(ctx, stage);
		const s = stage.svg;

		// ── The logo returns and the prompt types, as the voice says it (from frame 1) ──
		drawMark(mark, [0, 220, 440]);
		riseIn(letters, 300, ms("--dur-slow"), 18);
		panelIn(stage, box, 120, ms("--dur-draw") * 0.8);
		const wrapped = wrapColumns(PROMPT, COLS);
		const w1 = span(CUE.close);
		const start = amb.now();
		const keys = typeSchedule(PROMPT, start, start + w1 * 0.88, 7);
		let shown = -1;
		amb.add((t) => {
			const n = charsAt(keys, t);
			if (n !== shown) {
				shown = n;
				let left = n;
				wrapped.forEach((text, i) => {
					const take = Math.max(0, Math.min(text.length, left));
					lines[i].textContent = text.slice(0, take);
					left -= text.length + 1;
				});
				// The caret follows the last typed character onto the URL's line.
				const onSecond = n > wrapped[0].length;
				lines[onSecond ? 1 : 0].appendChild(caret);
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
		hudProbe(`PROMPT · ${PROMPT.length} CHARS`, keys[keys.length - 1] - start + 200, signal);

		await ctx.waitForNext();
		// ── "You'll have a video…": the closing line rises; the HUD locks onto the destination ──
		riseIn([stage.ref("closing")], 0);
		// The URL's box, with room for the caret: the corners settle clear of the type.
		const url = {
			x: BOX.x + BOX.text - 10,
			y: BOX.y + BOX.row1 + BOX.rowH + 6,
			w: DESTINATION.length * COL + 26,
			h: BOX.rowH - 12,
		};
		const lock = registerOn(s, url, 160, 16);
		// The destination is the signal, and stays so once the lock has let go.
		lines[1].animate([{ color: "var(--color-fg)" }, { color: "var(--amber)" }], {
			duration: 1,
			delay: 160,
			fill: "forwards",
		});
		flare(stage, url.x + url.w / 2, url.y + url.h / 2, 420);
		hudProbe("DESTINATION · README", 300, signal);

		// The release lands as the end hold begins, just after "cold.": the lock lets go and the
		// HUD settles. Then only the ambient layer moves until the final advance.
		const holdStart = (ADV[CUE.end] - END_HOLD - ADV[CUE.close]) * 1000;
		await ctx.hold(Math.max(0, holdStart + 400));
		release([], lock);
		hudProbe("STANDING BY", 300, signal);
		// play() resolves; the ambient layer runs on until the final advance ends the video.
	},

	unmount() {
		host = null;
	},
});
