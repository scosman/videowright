import { defineSegment } from "videowright";
import { fontsReady } from "../../components/v2/fonts.js";
import { decode, hudProbe, registerOn, release, showHud, tickTo } from "../../components/v2/hud.js";
import { css, ms, svg } from "../../components/v2/motion.js";
import { PROGRAM, startOf } from "../../components/v2/program.js";
import {
	type Stage,
	createStage,
	flare,
	panelIn,
	startAmbient,
} from "../../components/v2/stage.js";
import { charsAt } from "../../components/v2/typing.js";
import { ENVELOPE, ENVELOPE_STEP_S } from "./envelope.js";

// Beat 6: the meta-moment. This video's own voiceover_script/script.md, with the line you are
// hearing highlighted and swept word by word; under it, the video's timeline: its segment
// blocks on the grid's scale (1 cell = 0.5 s) over the waveform of the narration you are
// listening to, and a playhead at the video's real time. Then a cursor rewrites line 3 as the
// voice speaks it, and on "re-syncs" the narration is regenerated: its block grows, the blocks
// after it shift, and the timeline reads SYNCED again.

/** This segment's advances (s). Timing inside a window that must fit it derives from these. */
const ADV = [2.54, 5.44, 6.92, 8.922];
const CUE = { pace: 0, edit: 1, resync: 2, exit: 3 } as const;
const span = (i: number) => (ADV[i] - (i > 0 ? ADV[i - 1] : 0)) * 1000;

const ID = "v2-voiceover-sync";
/** Where this segment starts in the video (s): the playhead's zero. */
const START = startOf(ID);

const LINES = [
	"Your script generates an AI narration.",
	"The pace of the narration drives the video timing.",
	"Edit a line and the video re-syncs.",
];
/**
 * Each word's start (ms from its line's window start: the cue 150ms before its first word),
 * from timing.json. The paragraph has no pause markers inside it, so these survive re-timing.
 */
const WORD_MS = [
	[150, 310, 790, 1170, 1390, 1690],
	[150, 330, 590, 690, 790, 1410, 1810, 1930, 2250],
];
/**
 * Line 3's words as spoken, [start, end] ms from its window start (timing.json): the new line
 * types at the pace of the voice saying it. "re-syncs." runs past the next cue, so the last
 * word types in as the block grows.
 */
const LINE3_WORD_MS = [
	[150, 330],
	[390, 410],
	[470, 730],
	[990, 1070],
	[1090, 1190],
	[1230, 1490],
	[1630, 2170],
];
/** Characters appear this far ahead of the sound (ms), as the word highlight does. */
const WORD_LEAD = 40;
/** Line 3 before the edit: an older, shorter draft. */
const DRAFT = "Edits re-sync.";
/**
 * The new line's narration is longer than the draft's by this much (s): the block grows by it
 * and everything after it shifts. Scaled from the two lines' lengths and the new line's ~2s.
 */
const GROWTH_S = 1.2;
/** Line 3's narration in the video (s): from its cue word to the end of "re-syncs". */
const LINE3 = { from: START + ADV[CUE.edit] + 0.15, to: START + ADV[CUE.resync] + 0.7 };

/** The editor panel (stage px). Text is JetBrains Mono 40px (24px advance). */
const EDITOR = { x: 160, y: 150, w: 1600, h: 420, text: 300, gutter: 250, bar: 52 } as const;
const COL = 24;
/** Each script row's top (stage px): the heading, then the three sentence rows. */
const ROW_Y = [EDITOR.y + 76, EDITOR.y + 150, EDITOR.y + 230, EDITOR.y + 310];
const ROW_H = 72;

/**
 * The timeline lane: x 160–1760 shows 0:42–1:02 of the video, 80 px (two cells) a second: the
 * beats around this one, at a scale where the re-sync's 1.2 s growth reads at phone size.
 */
const LANE = { x: 160, w: 1600, t0: 42, pxPerS: 80 } as const;
const TL = {
	header: 618,
	labels: 666,
	blocks: 700,
	blockH: 64,
	wave: 780,
	waveH: 96,
	/** The dimension measuring the voiceover beat's block, under the waveform. */
	dim: 904,
} as const;
const laneX = (t: number) => (t - LANE.t0) * LANE.pxPerS;
const GROW_PX = GROWTH_S * LANE.pxPerS;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const pad2 = (n: number) => String(n).padStart(2, "0");
const clockLabel = (t: number) => `${Math.floor(t / 60)}:${pad2(Math.floor(t % 60))}`;

let host: HTMLElement | null = null;
let stage: Stage;
let refs: {
	panel: HTMLElement;
	band: HTMLElement;
	mark: HTMLElement;
	lines: HTMLElement[];
	marks: HTMLElement[];
	status: HTMLElement;
	blocks: HTMLElement[];
	duration: HTMLElement;
	dim: { line: HTMLElement; end: HTMLElement; chip: HTMLElement };
	playhead: HTMLElement;
	wave: { pre: SVGGElement; old: SVGGElement; edit: SVGGElement; post: SVGGElement };
};

/** Words of `text` as spans, one per word, for the spoken-word highlight. */
const wordSpans = (text: string) =>
	text
		.split(" ")
		.map((w) => `<span>${esc(w)}</span>`)
		.join(" ");

function buildEditor(content: HTMLElement): void {
	const panel = document.createElement("div");
	panel.className = "me-panel";
	panel.style.cssText = `position:absolute; left:${EDITOR.x}px; top:${EDITOR.y}px; width:${EDITOR.w}px; height:${EDITOR.h}px`;
	content.appendChild(panel);
	const rel = (y: number) => y - EDITOR.y;
	panel.innerHTML = `
		<div style="position:absolute; left:0; right:0; top:0; height:${EDITOR.bar}px; border-bottom:1px solid var(--color-border); display:flex; align-items:center; justify-content:space-between; padding:0 28px; font-family:var(--font-mono); font-size:22px; color:var(--fg-2); white-space:nowrap">
			<span>videos/demo_v2/voiceover_script/script.md</span>
			<span class="me-readout" style="color:var(--color-muted)">Markdown · soft wrap</span>
		</div>
		<div data-ref="band" style="position:absolute; left:${EDITOR.gutter - EDITOR.x - 12}px; right:20px; top:${rel(ROW_Y[1])}px; height:${ROW_H}px; background:color-mix(in srgb, var(--amber) 9%, transparent); border-radius:4px; opacity:0"></div>
		<div data-ref="mark" style="position:absolute; left:${EDITOR.gutter - EDITOR.x - 12}px; width:4px; top:${rel(ROW_Y[1])}px; height:${ROW_H}px; background:var(--amber); opacity:0"></div>
		<div class="me-mono" style="position:absolute; left:0; width:${EDITOR.gutter - EDITOR.x - 40}px; top:${rel(ROW_Y[0])}px; line-height:${ROW_H}px; text-align:right; color:var(--color-muted)">18</div>
		<div class="me-mono" style="position:absolute; left:0; width:${EDITOR.gutter - EDITOR.x - 40}px; top:${rel(ROW_Y[1])}px; line-height:${ROW_H}px; text-align:right; color:var(--color-muted)">19</div>
		<div class="me-mono" style="position:absolute; left:${EDITOR.text - EDITOR.x}px; top:${rel(ROW_Y[0])}px; line-height:${ROW_H}px; font-size:32px; color:var(--color-muted); white-space:pre">## ${ID}</div>
		${LINES.map(
			(_, i) => `
			<div data-ref="past-${i}" style="position:absolute; left:${EDITOR.gutter - EDITOR.x - 12}px; width:4px; top:${rel(ROW_Y[i + 1]) + 14}px; height:${ROW_H - 28}px; background:var(--cyan); opacity:0"></div>
			<div data-ref="line-${i}" class="me-mono" style="position:absolute; left:${EDITOR.text - EDITOR.x}px; top:${rel(ROW_Y[i + 1])}px; line-height:${ROW_H}px; font-size:40px; color:var(--color-muted); white-space:pre">${i < 2 ? wordSpans(LINES[i]) : esc(DRAFT)}</div>`,
		).join("")}`;
	const q = (ref: string) => panel.querySelector(`[data-ref="${ref}"]`) as HTMLElement;
	refs.panel = panel;
	refs.band = q("band");
	refs.mark = q("mark");
	refs.lines = LINES.map((_, i) => q(`line-${i}`));
	refs.marks = LINES.map((_, i) => q(`past-${i}`));
}

function buildTimeline(content: HTMLElement): void {
	const box = document.createElement("div");
	box.style.cssText = "position:absolute; inset:0";
	box.innerHTML = `
		<div class="me-label" style="position:absolute; left:${LANE.x}px; top:${TL.header + 6}px">Timeline · demo_v2 · 1 cell = 0.5 s</div>
		<div class="me-mono" data-ref="status" style="position:absolute; right:${1920 - LANE.x - LANE.w}px; top:${TL.header - 6}px; color:var(--ok); white-space:pre">SYNCED ✓</div>
		<div data-ref="lane" style="position:absolute; left:${LANE.x}px; top:${TL.labels}px; width:${LANE.w}px; height:${TL.dim + 30 - TL.labels}px; overflow:hidden"></div>`;
	content.appendChild(box);
	const lane = box.querySelector('[data-ref="lane"]') as HTMLElement;
	refs.status = box.querySelector('[data-ref="status"]') as HTMLElement;
	const top = (y: number) => y - TL.labels;

	// Time labels every 4 s, on the grid's major lines.
	for (let t = LANE.t0 + 4; t < LANE.t0 + LANE.w / LANE.pxPerS; t += 4) {
		lane.insertAdjacentHTML(
			"beforeend",
			`<span class="me-readout" style="position:absolute; left:${laneX(t) + 6}px; top:0; color:var(--color-muted)">${clockLabel(t)}</span>
			<span style="position:absolute; left:${laneX(t)}px; top:0; width:1px; height:${top(TL.blocks)}px; background:var(--hairline)"></span>`,
		);
	}

	// The blocks, as the timing stood before the edit: the voiceover beat 1.2 s shorter, the
	// blocks after it 1.2 s earlier.
	const current = PROGRAM.findIndex((e) => e.id === ID);
	refs.blocks = PROGRAM.map((entry, i) => {
		const from = startOf(entry.id);
		const width = entry.seconds * LANE.pxPerS - (i === current ? GROW_PX : 0);
		const el = document.createElement("div");
		const on = i === current;
		el.style.cssText = `position:absolute; left:${laneX(from) + 1}px; top:${top(TL.blocks)}px; width:${width - 2}px; height:${TL.blockH}px; box-sizing:border-box; border-radius:4px; border:${on ? "2px solid var(--amber)" : "1px solid var(--color-border)"}; background:${on ? "color-mix(in srgb, var(--amber) 10%, var(--surface-1))" : "var(--surface-2)"}; overflow:hidden; white-space:nowrap`;
		// A block that starts left of the lane keeps its label in view.
		const labelX = Math.max(12, 12 - laneX(from));
		el.innerHTML = `<span class="me-readout" style="position:absolute; left:${labelX}px; top:${on ? 20 : 21}px; color:${on ? "var(--color-fg)" : "var(--fg-2)"}">${pad2(i + 1)} ${entry.name}</span>`;
		if (i > current) el.style.transform = `translateX(${-GROW_PX}px)`;
		lane.appendChild(el);
		return el;
	});
	// The HUD measures the voiceover beat's block: a cyan dimension under the waveform, clear of
	// the playhead, its value in a chip at the centre.
	const x0 = laneX(START);
	const w0 = PROGRAM[current].seconds * LANE.pxPerS - GROW_PX;
	const dimY = top(TL.dim);
	lane.insertAdjacentHTML(
		"beforeend",
		`<div style="position:absolute; left:${x0}px; top:${dimY - 12}px; width:2px; height:24px; background:var(--cyan)"></div>
		<div data-ref="dim-line" style="position:absolute; left:${x0}px; top:${dimY - 1}px; width:${w0}px; height:2px; background:var(--cyan)"></div>
		<div data-ref="dim-end" style="position:absolute; left:${x0 + w0 - 2}px; top:${dimY - 12}px; width:2px; height:24px; background:var(--cyan)"></div>
		<div data-ref="dim-chip" style="position:absolute; left:${x0 + w0 / 2 - 70}px; top:${dimY - 20}px; width:140px; height:40px; background:var(--color-bg); text-align:center">
			<span class="me-readout" data-ref="duration" style="font-size:var(--type-mono); line-height:40px">${(PROGRAM[current].seconds - GROWTH_S).toFixed(2)} S</span>
		</div>`,
	);
	const ref = (name: string) => lane.querySelector(`[data-ref="${name}"]`) as HTMLElement;
	refs.duration = ref("duration");
	refs.dim = { line: ref("dim-line"), end: ref("dim-end"), chip: ref("dim-chip") };

	// The narration's waveform: one bar per 0.1 s of this video's track.
	const wave = svg(lane, "svg", {
		width: LANE.w,
		height: TL.waveH,
		viewBox: `0 0 ${LANE.w} ${TL.waveH}`,
		style: `position:absolute; left:0; top:${top(TL.wave)}px; overflow:visible`,
	});
	const mid = TL.waveH / 2;
	// Half of each 0.1 s step: the bars keep the same rhythm at any scale.
	const BAR_W = Math.max(2, LANE.pxPerS * ENVELOPE_STEP_S * 0.5);
	const group = (cls: string) => svg(wave, "g", { class: cls });
	const pre = group("pre");
	const old = group("old");
	const edit = group("edit");
	const post = group("post");
	const ownFrom = START;
	const ownTo = startOf(PROGRAM[current + 1].id);
	const bar = (g: SVGGElement, x: number, level: number, t: number) => {
		const h = Math.max(2, (level / 35) * (TL.waveH - 12));
		const own = t >= ownFrom && t < ownTo;
		return svg(g, "rect", {
			x: x.toFixed(1),
			y: (mid - h / 2).toFixed(1),
			width: BAR_W,
			height: h.toFixed(1),
			fill: own ? "var(--cyan)" : "var(--color-muted)",
			opacity: own ? 0.85 : 0.55,
		});
	};
	const levelAt = (b: number) => Number.parseInt(ENVELOPE[b] ?? "0", 36);
	const bins = Math.ceil((LANE.t0 + LANE.w / LANE.pxPerS) / ENVELOPE_STEP_S);
	for (let b = Math.floor(LANE.t0 / ENVELOPE_STEP_S); b < bins; b++) {
		const t = b * ENVELOPE_STEP_S;
		const g = t < LINE3.from ? pre : t < LINE3.to ? edit : post;
		bar(g, laneX(t), levelAt(b), t);
	}
	// The draft's narration: line 3's bars, squeezed into the draft's shorter read.
	const oldLength = LINE3.to - LINE3.from - GROWTH_S;
	for (let t = 0; t < oldLength; t += ENVELOPE_STEP_S) {
		const b = Math.floor(
			(LINE3.from + (t * (LINE3.to - LINE3.from)) / oldLength) / ENVELOPE_STEP_S,
		);
		bar(old, laneX(LINE3.from + t), levelAt(b), LINE3.from);
	}
	edit.style.visibility = "hidden";
	post.style.transform = `translateX(${-GROW_PX}px)`;
	refs.wave = { pre, old, edit, post };

	// The playhead, at the video's real time.
	const head = document.createElement("div");
	head.style.cssText = `position:absolute; left:0; top:${top(TL.blocks) - 10}px; width:0; height:${TL.wave + TL.waveH - TL.blocks + 14}px`;
	head.innerHTML = `
		<div style="position:absolute; left:-1px; top:0; bottom:0; width:2px; background:var(--color-fg); box-shadow:0 0 0 1px rgba(10, 14, 20, 0.6)"></div>
		<div style="position:absolute; left:-9px; top:-4px; width:0; height:0; border-left:9px solid transparent; border-right:9px solid transparent; border-top:12px solid var(--color-fg)"></div>`;
	lane.appendChild(head);
	refs.playhead = head;
}

export default defineSegment({
	id: ID,
	advances: [2.54, 5.44, 6.92, 8.922],
	voiceover:
		"Your script generates an AI narration. The pace of the narration drives the video timing. Edit a line and the video re-syncs.",
	notes:
		"Entered on me-push. Line 1 is spoken from frame 1 ('Your'). Advances, each 0.15s before its word: 'The' (line 2), 'Edit' (the cursor selects line 3 and retypes it), 're-syncs' (the block re-times), exit before 'And'.",

	async mount(el, ctx) {
		await fontsReady();
		host = el;
		refs = {} as typeof refs;
		stage = createStage(el, { key: { x: 860, y: 380 }, scanPhase: 2600 });
		stage.setOrigin(960, 540);
		buildEditor(stage.content);
		buildTimeline(stage.content);
		refs.playhead.style.transform = `translateX(${laneX(START)}px)`;
		showHud(el, {
			beat: 6,
			total: 8,
			section: "Voiceover",
			probe: "VOICE · COSMAN-1 · ELEVENLABS V4",
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
		panelIn(stage, refs.panel, 0, ms("--dur-draw") * 0.8);

		// The playhead runs at the video's own time until the edit pauses playback; once the
		// timeline is synced again it plays on from where it paused, into the new narration.
		let playing = true;
		let pausedAt = 0;
		const play = (from: number, at: number) =>
			amb.add((t) => {
				if (!playing) return false;
				const time = START + (from + Math.max(0, t - at)) / 1000;
				refs.playhead.style.transform = `translateX(${laneX(time).toFixed(2)}px)`;
				return true;
			});
		play(0, 0);

		// The current line: the band and its amber mark arrive on it (then slide from line to
		// line); its words light from muted to fg as they are spoken. Lines already read recede
		// to fg-2 with a cyan mark (the style's focus shift).
		let current = 0;
		const moveFocus = (i: number) => {
			const offset = (row: number) => ROW_Y[row + 1] - ROW_Y[1];
			const move = {
				duration: ms("--dur-normal"),
				easing: css("--ease-settle"),
				fill: "forwards" as const,
			};
			for (const el of [refs.band, refs.mark]) {
				el.animate(
					[
						{ transform: `translateY(${offset(current)}px)` },
						{ transform: `translateY(${offset(i)}px)` },
					],
					move,
				);
			}
			const past = refs.lines[current];
			for (const w of past.querySelectorAll("span")) {
				for (const a of (w as HTMLElement).getAnimations()) a.cancel();
			}
			past.style.color = "var(--fg-2)";
			refs.marks[current].style.opacity = "1";
			current = i;
			if (i < 2) {
				sweep(refs.lines[i], WORD_MS[i]);
			}
		};
		// Line 1, from frame 1 ("Your script…"): the band draws out of the gutter.
		refs.band.style.transformOrigin = "0 50%";
		refs.band.animate(
			[
				{ transform: "scaleX(0)", opacity: 1 },
				{ transform: "none", opacity: 1 },
			],
			{
				duration: ms("--dur-slow"),
				delay: 120,
				easing: css("--ease-settle"),
				fill: "both",
			},
		);
		refs.mark.animate(
			[
				{ transform: "scaleY(0)", opacity: 1 },
				{ transform: "none", opacity: 1 },
			],
			{
				duration: ms("--dur-normal"),
				delay: 120,
				easing: css("--ease-settle"),
				fill: "both",
			},
		);
		sweep(refs.lines[0], WORD_MS[0]);

		await ctx.waitForNext();
		// ── "The pace of the narration…": line 2 ──
		moveFocus(1);
		hudProbe("PACE · 137 WORDS / MIN", 200, signal);
		// The cursor comes in late in the window and rests at the end of line 3, ready.
		const w2 = span(CUE.edit);
		const rest = { x: EDITOR.text + DRAFT.length * COL + 34, y: ROW_Y[3] + ROW_H / 2 + 2 };
		const cursor = svg(s, "g", { opacity: 0 });
		svg(cursor, "path", {
			d: "M0 0V34L8.5 26.2L14 39L20.5 36.2L15 23.6H26.5Z",
			fill: "#0a0a0a",
			stroke: "#fff",
			"stroke-width": 2.5,
			"stroke-linejoin": "round",
		});
		cursor.animate(
			[
				{ transform: "translate(1380px, 640px)" },
				{ transform: `translate(${rest.x}px, ${rest.y}px)` },
			],
			{ duration: w2 * 0.32, delay: w2 * 0.6, easing: css("--ease-settle"), fill: "both" },
		);
		cursor.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 120,
			delay: w2 * 0.6,
			fill: "both",
		});

		await ctx.waitForNext();
		// ── "Edit a line…": a triple-click selects the draft, then the line types as it is
		// spoken. Editing pauses playback. ──
		playing = false;
		pausedAt = amb.now();
		const ring = svg(s, "circle", {
			cx: rest.x,
			cy: rest.y,
			r: 10,
			fill: "none",
			stroke: "var(--amber)",
			"stroke-width": 3,
			opacity: 0,
		});
		ring.style.transformOrigin = `${rest.x}px ${rest.y}px`;
		ring.animate(
			[
				{ transform: "scale(1)", opacity: 0.95 },
				{ transform: "scale(3.2)", opacity: 0 },
			],
			{ duration: 480, easing: css("--ease-settle"), fill: "forwards" },
		);
		const line3 = refs.lines[2];
		const selection = document.createElement("div");
		selection.style.cssText = `position:absolute; left:${EDITOR.text - EDITOR.x - 4}px; top:${ROW_Y[3] - EDITOR.y + 12}px; width:${DRAFT.length * COL + 8}px; height:${ROW_H - 24}px; background:color-mix(in srgb, var(--cyan) 30%, transparent); visibility:hidden`;
		refs.panel.insertBefore(selection, line3);
		selection.animate([{ visibility: "visible" }, { visibility: "visible" }], {
			duration: 1,
			delay: 60,
			fill: "forwards",
		});
		moveFocus(2);
		decode(amb, refs.status, "EDITED · LINE 19", amb.now() + 60, { signal });
		refs.status.animate([{ color: "var(--amber)" }, { color: "var(--amber)" }], {
			duration: 1,
			delay: 60,
			fill: "forwards",
		});
		hudProbe("PLAYBACK PAUSED · EDITING", 120, signal);
		// The cursor drifts off the line while the keys go in, and is gone before the re-sync.
		const w3 = span(CUE.resync);
		cursor.animate(
			[
				{ transform: `translate(${rest.x}px, ${rest.y}px)` },
				{ transform: `translate(${rest.x + 90}px, ${rest.y + 60}px)` },
			],
			{ duration: w3 * 0.5, delay: 260, easing: css("--ease-settle"), fill: "forwards" },
		);
		cursor.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: 160,
			delay: w3 * 0.7,
			fill: "forwards",
		});
		const keys = line3Keys(amb.now());
		const caret = `<span style="display:inline-block; width:3px; height:46px; margin-left:2px; vertical-align:-10px; background:var(--color-fg)"></span>`;
		let typed = -1;
		amb.add((t) => {
			const n = charsAt(keys, t);
			if (n === typed) return true;
			typed = n;
			if (n === 0) return true;
			selection.style.display = "none";
			line3.style.color = "var(--color-fg)";
			// The caret goes once the line is complete: the edit is in.
			line3.innerHTML = `${esc(LINES[2].slice(0, n))}${n < LINES[2].length ? caret : ""}`;
			return n < LINES[2].length;
		});

		await ctx.waitForNext();
		// ── "…re-syncs": the narration is regenerated. The signal moves from the line to its
		// block: the line's band goes cyan, the HUD locks onto the block's new size, a ghost of
		// its old edge stays, the draft's bars drop, the block grows into the lock, everything
		// after it shifts, the new bars rise, and the timeline reads SYNCED. ──
		const w4 = span(CUE.exit);
		const toCyan = { duration: ms("--dur-fast"), fill: "forwards" as const };
		refs.band.animate(
			[
				{ backgroundColor: "color-mix(in srgb, var(--amber) 9%, transparent)" },
				{ backgroundColor: "color-mix(in srgb, var(--cyan) 9%, transparent)" },
			],
			toCyan,
		);
		refs.mark.animate(
			[{ backgroundColor: "var(--amber)" }, { backgroundColor: "var(--cyan)" }],
			toCyan,
		);
		decode(amb, refs.status, "RE-SYNCING…", amb.now(), { signal });
		const grow = {
			duration: ms("--dur-slow"),
			delay: 140,
			easing: css("--ease-settle"),
			fill: "forwards" as const,
		};
		const current06 = PROGRAM.findIndex((e) => e.id === ID);
		const block = refs.blocks[current06];
		const width = block.offsetWidth;
		block.animate([{ width: `${width}px` }, { width: `${width + GROW_PX}px` }], grow);
		for (const later of refs.blocks.slice(current06 + 1)) {
			later.animate([{ transform: `translateX(${-GROW_PX}px)` }, { transform: "none" }], grow);
		}
		refs.wave.post.animate(
			[{ transform: `translateX(${-GROW_PX}px)` }, { transform: "none" }],
			grow,
		);
		refs.wave.old.style.transformOrigin = `0 ${TL.waveH / 2}px`;
		refs.wave.old.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }], {
			duration: ms("--dur-fast"),
			easing: css("--ease-exit"),
			fill: "forwards",
		});
		refs.wave.edit.style.visibility = "";
		const bars = [...refs.wave.edit.children] as SVGRectElement[];
		bars.forEach((b, i) => {
			b.style.transformBox = "fill-box";
			b.style.transformOrigin = "50% 50%";
			b.animate([{ transform: "scaleY(0)" }, { transform: "none" }], {
				duration: ms("--dur-normal"),
				delay: 180 + (i / bars.length) * w4 * 0.22,
				easing: css("--ease-settle"),
				fill: "both",
			});
		});
		refs.dim.line.animate(
			[
				{ width: `${refs.dim.line.offsetWidth}px` },
				{ width: `${refs.dim.line.offsetWidth + GROW_PX}px` },
			],
			grow,
		);
		refs.dim.end.animate([{ transform: "none" }, { transform: `translateX(${GROW_PX}px)` }], grow);
		refs.dim.chip.animate(
			[{ transform: "none" }, { transform: `translateX(${GROW_PX / 2}px)` }],
			grow,
		);
		const seconds = PROGRAM[current06].seconds;
		tickTo(
			amb,
			refs.duration,
			seconds,
			amb.now() + 140,
			ms("--dur-slow"),
			(v) => `${v.toFixed(2)} S`,
			seconds - GROWTH_S,
		);
		const syncedAt = amb.now() + w4 * 0.42;
		decode(amb, refs.status, "SYNCED ✓", syncedAt, { signal });
		refs.status.animate([{ color: "var(--amber)" }, { color: "var(--ok)" }], {
			duration: 1,
			delay: syncedAt - amb.now(),
			fill: "forwards",
		});
		setTimeout(() => {
			if (signal.aborted) return;
			playing = true;
			play(pausedAt, amb.now());
		}, syncedAt - amb.now());
		const blockX = LANE.x + laneX(START);
		const blockLock = registerOn(
			s,
			{ x: blockX, y: TL.blocks, w: seconds * LANE.pxPerS, h: TL.blockH },
			140,
			10,
			24,
		);
		// A dashed ghost of the block's old edge: the +1.20 s gap, and 07-08 moving off it.
		const oldEdge = blockX + (seconds - GROWTH_S) * LANE.pxPerS;
		const ghost = svg(s, "path", {
			d: `M${oldEdge} 690 V876`,
			stroke: "var(--cyan)",
			"stroke-width": 2,
			"stroke-dasharray": "6 6",
			fill: "none",
			opacity: 0.7,
		});
		ghost.style.transformBox = "fill-box";
		ghost.style.transformOrigin = "50% 0";
		ghost.animate([{ transform: "scaleY(0)" }, { transform: "none" }], {
			duration: ms("--dur-normal"),
			delay: 140,
			easing: css("--ease-draw"),
			fill: "both",
		});
		amb.nudge(0.015, 1200);
		flare(stage, blockX + (seconds * LANE.pxPerS) / 2, TL.blocks + TL.blockH / 2, 300);
		hudProbe(`RETIMED 06 · +${GROWTH_S.toFixed(2)} S · 07–08 SHIFTED`, 240, signal);

		// Release before the exit: the band, the lock and the ghost let go; the camera rests.
		const out = ms("--dur-exit");
		await ctx.hold(Math.max(0, w4 - out * 1.6));
		release([], [refs.band, refs.mark, ...blockLock, ghost]);
		amb.rest(out * 1.4);
		await ctx.hold(out * 1.4);
	},

	unmount() {
		host = null;
	},
});

/** Lights each word of `line` as it is spoken: word i at `wordMs[i]`, a beat ahead of the sound. */
function sweep(line: HTMLElement, wordMs: readonly number[]) {
	[...line.querySelectorAll("span")].forEach((w, i) => {
		(w as HTMLElement).animate([{ color: "var(--color-muted)" }, { color: "var(--color-fg)" }], {
			duration: 1,
			delay: wordMs[i] - WORD_LEAD,
			fill: "both",
		});
	});
}

/**
 * When each character of line 3 types (ticker ms), from `from` (its cue): each word types over
 * the time it is spoken, its following space as it ends.
 */
function line3Keys(from: number): number[] {
	const words = LINES[2].split(" ");
	return words.flatMap((word, w) => {
		const [start, end] = LINE3_WORD_MS[w];
		const keys = [...word].map((_, j) => from + start + ((end - start) * j) / word.length);
		if (w < words.length - 1) keys.push(from + end);
		return keys.map((k) => k - WORD_LEAD);
	});
}
