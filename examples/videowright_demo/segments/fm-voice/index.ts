import { defineSegment } from "videowright";
import { type Rig, createRig } from "../../components/fm/rig.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { SVG_NS, createTicker, css } from "../../components/v2/motion.js";
import { createStage } from "../../components/v2/stage.js";
import cues from "../../videos/2026_11_five_months/audio/cues.json";
import { NOW_ENVELOPE, THEN_ENVELOPE } from "./envelopes.js";

// The voice beat: the narration is the example. The same rig as the pairs, but the window holds
// a voice instrument instead of footage: the line's real waveform with a playhead, and its
// words, large, lighting on their real times. Then: the old voice (Asher, ElevenLabs v2)
// describes itself. The sweep. Now: the owner's cloned voice (ElevenLabs v4) answers, its
// emotion tags shown as amber chips, so a muted viewer sees the cues too.

const SEGMENT = cues.segments["fm-voice"];
/** This segment's start on the track (s): its word times are track times minus this. */
const START = SEGMENT.start;

const THEN_TEXT = "Previously, the voice was slightly robotic, and lacked any emotion cues.";
const NOW_TEXT =
	"[factual] This is the new one. It's my own voice, cloned. [confident] And it can match its tone to the message.";

const WAVE = { x: 100, y: 150, w: 1240, h: 250 };
const ENV_RATE = 30;

interface Word {
	text: string;
	/** Segment-relative seconds. */
	at: number;
	/** An emotion tag shown before the word. */
	tag?: string;
}

/** Pairs the script's words (and tags) with the narration's word times, in order. */
function wordsOf(text: string, times: number[]): Word[] {
	const out: Word[] = [];
	let tag: string | undefined;
	let i = 0;
	for (const token of text.split(" ")) {
		const m = token.match(/^\[(.+)\]$/);
		if (m) {
			tag = m[1];
			continue;
		}
		out.push({ text: token, at: times[i++] ?? Number.POSITIVE_INFINITY, tag });
		tag = undefined;
	}
	if (i !== times.length)
		throw new Error(`fm-voice: ${i} script words, ${times.length} timed words`);
	return out;
}

const thenWords = wordsOf(
	THEN_TEXT,
	cues.voice.thenLine.words.map((w) => w.start - START),
);
const nowWords = wordsOf(
	NOW_TEXT,
	cues.voice.nowLine.words.map((w) => w.start - START),
);

interface Panel {
	tick(t: number): void;
}

/** One side of the beat: the waveform and the words. */
function buildPanel(
	layer: HTMLElement,
	envelope: { at: number; values: number[] },
	words: Word[],
	played: string,
): Panel {
	layer.innerHTML = `<div data-ref="words" style="position:absolute; left:80px; right:80px; top:470px; text-align:center; font-family:var(--font-display); font-size:70px; font-weight:600; font-stretch:var(--stretch-body); line-height:1.22; color:var(--color-fg)"></div>`;
	const values = envelope.values;
	const envAt = envelope.at - START;
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.setAttribute("width", "1440");
	svg.setAttribute("height", "810");
	svg.style.cssText = "position:absolute; left:0; top:0";
	const pitch = WAVE.w / values.length;
	const bars = (fill: string) => {
		const g = document.createElementNS(SVG_NS, "g");
		g.setAttribute("fill", fill);
		values.forEach((v, i) => {
			const h = Math.max(4, (v / 100) * WAVE.h);
			const r = document.createElementNS(SVG_NS, "rect");
			r.setAttribute("x", (WAVE.x + i * pitch).toFixed(2));
			r.setAttribute("y", (WAVE.y + (WAVE.h - h) / 2).toFixed(2));
			r.setAttribute("width", Math.max(2, pitch * 0.62).toFixed(2));
			r.setAttribute("height", h.toFixed(2));
			r.setAttribute("rx", "2");
			g.appendChild(r);
		});
		return g;
	};
	const clipId = `fm-voice-clip-${layer.dataset.ref ?? "x"}`;
	svg.innerHTML = `<defs><clipPath id="${clipId}"><rect data-ref="clip" x="${WAVE.x}" y="0" width="0" height="810"/></clipPath></defs>`;
	svg.appendChild(bars("rgba(150, 215, 240, 0.22)"));
	const lit = bars(played);
	lit.setAttribute("clip-path", `url(#${clipId})`);
	svg.appendChild(lit);
	const head = document.createElementNS(SVG_NS, "rect");
	head.setAttribute("y", String(WAVE.y - 24));
	head.setAttribute("width", "3");
	head.setAttribute("height", String(WAVE.h + 48));
	head.setAttribute("fill", css("--cyan"));
	svg.appendChild(head);
	layer.appendChild(svg);
	const clip = svg.querySelector('[data-ref="clip"]') as SVGRectElement;

	const box = layer.querySelector('[data-ref="words"]') as HTMLElement;
	const spans: Array<{ el: HTMLElement; at: number }> = [];
	for (const w of words) {
		if (w.tag) {
			const chip = document.createElement("span");
			chip.textContent = w.tag.toUpperCase();
			chip.style.cssText =
				"display:inline-block; vertical-align:0.16em; margin-right:0.3em; padding:4px 16px; border:3px solid var(--amber); border-radius:10px; color:var(--amber); font-family:var(--font-mono); font-size:40px; font-weight:600; letter-spacing:0.1em; line-height:1.2";
			box.appendChild(chip);
			spans.push({ el: chip, at: w.at - 0.25 });
		}
		const span = document.createElement("span");
		span.textContent = w.text;
		box.append(span, " ");
		spans.push({ el: span, at: w.at });
	}
	for (const s of spans) s.el.style.opacity = "0.22";

	return {
		tick(t) {
			const x = Math.min(Math.max((t - envAt) * ENV_RATE * pitch, 0), WAVE.w);
			clip.setAttribute("width", x.toFixed(2));
			head.setAttribute("x", (WAVE.x + x - 1.5).toFixed(2));
			for (const s of spans) s.el.style.opacity = t >= s.at - 0.04 ? "1" : "0.22";
		},
	};
}

let rig: Rig;
let thenPanel: Panel;
let nowPanel: Panel;

export default defineSegment({
	id: "fm-voice",
	advances: SEGMENT.advances,
	voiceover:
		"(Then, Asher v2) Previously, the voice was slightly robotic, and lacked any emotion cues. (Now, Cosman-1 v4) This is the new one. It's my own voice, cloned. And it can match its tone to the message.",
	notes:
		"Entered on a hard cut from the narration-sync pair (marker at NOW, rewound). The Asher line starts 0.6s in. Advance 1: the sweep, 0.15s before 'This'. Advance 2: exit, 0.15s before the CTA's 'Both'. Word times from audio/cues.json.",

	async mount(el) {
		await fontsReady();
		createStage(el, { key: { x: 960, y: 440 } });
		rig = createRig(el, {
			captions: ["ElevenLabs v2 · stock voice", "ElevenLabs v4 · my cloned voice"],
			state: "now",
		});
		thenPanel = buildPanel(rig.thenLayer, THEN_ENVELOPE, thenWords, css("--fg-2"));
		nowPanel = buildPanel(rig.nowLayer, NOW_ENVELOPE, nowWords, css("--amber"));
		thenPanel.tick(0);
		nowPanel.tick(0);
	},

	async play(ctx) {
		const ticker = createTicker(() => ctx.clock(), ctx.signal);
		ticker.add((t) => {
			thenPanel.tick(t / 1000);
			nowPanel.tick(t / 1000);
			return true;
		});
		rig.rewind();
		await ctx.waitForNext();
		rig.sweep();
		await ctx.waitForNext();
	},
});
