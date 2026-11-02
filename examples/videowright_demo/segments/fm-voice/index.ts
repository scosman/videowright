import { defineSegment } from "videowright";
import { type Rig, createRig } from "../../components/fm/rig.js";
import { fontsReady } from "../../components/v2/fonts.js";
import { SVG_NS, createTicker, css } from "../../components/v2/motion.js";
import { createStage } from "../../components/v2/stage.js";
import thenTiming from "../../videos/2026_11_five_months/audio/originals/voiceovers/then_asher_v2/timing.json";
import nowTiming from "../../videos/2026_11_five_months/audio/originals/voiceovers/v1/timing.json";
import { NOW_ENVELOPE, THEN_ENVELOPE } from "./envelopes.js";

// The voice beat: the narration is the example. The same rig as the pairs, but the window holds
// a voice instrument instead of footage: a "Sound on" chip (the one beat that needs it), the
// line's real waveform with a playhead, and its words, large, lighting on their real times. Then:
// the old voice (Asher, ElevenLabs v2) describes itself. The sweep. Now: the owner's cloned
// voice (ElevenLabs v4) answers, its emotion tags shown as amber chips, so a muted viewer sees
// the cues too.

/** This segment's start on the track (s): its word times are track times minus this. */
const START = 41.75;
/** Where the audio plan places the Asher line (s, track). */
const ASHER_AT = 42.6;

const THEN_TEXT = "Previously, the voice was slightly robotic, and lacked any emotion cues.";
const NOW_TEXT =
	"[warmly] This is the new one. It's my real voice, cloned. [excited] And now it can actually sound excited!";

const WAVE = { x: 100, y: 196, w: 1240, h: 210 };
const ENV_RATE = 30;

interface Word {
	text: string;
	/** Segment-relative seconds. */
	at: number;
	/** An emotion tag shown before the word. */
	tag?: string;
}

/** Pairs the script's words (and tags) with the STT's word times, in order. */
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
	return out;
}

type Timed = { words: Array<{ start: number }> };
const thenWords = wordsOf(
	THEN_TEXT,
	(thenTiming as Timed).words.map((w) => ASHER_AT + w.start - START),
);
const nowWords = wordsOf(
	NOW_TEXT,
	(nowTiming as Timed).words
		.filter((w) => w.start >= 49 && w.start < 54.3)
		.map((w) => w.start - START),
);

interface Panel {
	tick(t: number): void;
}

/** One side of the beat: the chip, the waveform, the words. */
function buildPanel(
	layer: HTMLElement,
	envelope: number[],
	envAt: number,
	words: Word[],
	played: string,
): Panel {
	layer.innerHTML = `
		<div style="position:absolute; left:0; right:0; top:44px; display:flex; justify-content:center">
			<div style="display:flex; align-items:center; gap:20px; padding:16px 40px; border:3px solid var(--amber); border-radius:999px; color:var(--amber); font-family:var(--font-body); font-size:50px; font-weight:600; letter-spacing:0.02em">
				<svg width="56" height="50" viewBox="0 0 44 40" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 14h8l10-9v30l-10-9H4z" fill="currentColor" stroke="none"/>
					<path d="M29 13c3 4 3 10 0 14"/><path d="M35 8c6 7 6 17 0 24"/>
				</svg>
				Sound on for this one
			</div>
		</div>
		<div data-ref="words" style="position:absolute; left:80px; right:80px; top:470px; text-align:center; font-family:var(--font-display); font-size:70px; font-weight:600; font-stretch:var(--stretch-body); line-height:1.2; color:var(--color-fg)"></div>`;
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.setAttribute("width", "1440");
	svg.setAttribute("height", "810");
	svg.style.cssText = "position:absolute; left:0; top:0";
	const pitch = WAVE.w / envelope.length;
	const bars = (fill: string) => {
		const g = document.createElementNS(SVG_NS, "g");
		g.setAttribute("fill", fill);
		envelope.forEach((v, i) => {
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
	const clipId = `fm-voice-clip-${Math.random().toString(36).slice(2)}`;
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
				"display:inline-block; vertical-align:0.18em; margin-right:0.3em; padding:4px 16px; border:3px solid var(--amber); border-radius:10px; color:var(--amber); font-family:var(--font-mono); font-size:40px; font-weight:600; letter-spacing:0.1em; line-height:1.2";
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
	advances: [7.133, 13.967],
	voiceover:
		"(Then, Asher v2) Previously, the voice was slightly robotic, and lacked any emotion cues. (Now, Cosman-1 v4) This is the new one. It's my real voice, cloned, and now it can actually sound excited!",
	notes:
		"Entered on a hard cut from the narration-sync pair (marker at NOW, rewound). The Asher line plays at track 42.60s (segment 0.85s). Advance 1: the sweep, 0.15s before 'This' (49.032). Advance 2: exit, 0.15s before the CTA's 'Both' (55.87).",

	async mount(el) {
		await fontsReady();
		createStage(el, { key: { x: 960, y: 440 } });
		rig = createRig(el, {
			captions: ["ElevenLabs v2 · stock voice", "ElevenLabs v4 · my cloned voice"],
			state: "now",
		});
		thenPanel = buildPanel(
			rig.thenLayer,
			THEN_ENVELOPE,
			ASHER_AT - START,
			thenWords,
			css("--fg-2"),
		);
		nowPanel = buildPanel(rig.nowLayer, NOW_ENVELOPE, 48.95 - START, nowWords, css("--amber"));
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
