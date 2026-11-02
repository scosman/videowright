#!/usr/bin/env node
// demo_v2's sync, frame-exact: computes every segment's advances from the take's timing.json
// (sync_algorithm.md, anchored 0.15 s before each cue word) and writes them into the files that
// carry them: tracks/v1/track.ts and voiceovers/v1/voiceover.ts (timing.perSegment), each
// segment's `advances` and `const ADV`, and components/v2/program.ts (each segment's length).
//
// The render fires a segment's advance a on frame start + round(a × 60), where start is the sum
// of the earlier segments' round(final × 60). A cued advance lands on the frame 9 frames
// (0.150 s) before its word's frame, so its lead is 0.150 s to within half a frame and never
// more. Values are written with 3 decimals; round(a × 60) recovers the frame exactly.
//
// Usage: node sync_advances.mjs [--write]   (prints the table; --write updates the files)
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FPS = 60;
const LEAD_FRAMES = 9; // 0.150 s at 60 fps
const DEMO = join(dirname(fileURLToPath(import.meta.url)), "../../../../examples/videowright_demo");
const VIDEO = join(DEMO, "videos/demo_v2");
const VO_DIR = join(VIDEO, "audio/originals/voiceovers/v1");
const TRACK_TS = join(VIDEO, "audio/tracks/v1/track.ts");
const TRACK_MP3 = join(VIDEO, "audio/tracks/v1/track.mp3");
const VO_TS = join(VO_DIR, "voiceover.ts");
const PROGRAM_TS = join(DEMO, "components/v2/program.ts");
/** The VO's placement in the track (audio_plan.md, Cue 2). */
const PLACE_AT = 0.6;
/** The hard cut sits this many frames before the title's "Videowright" (in the breath). */
const CUT_FRAMES = 37;
/** The title card's release follows "technologies." by this many frames. */
const RELEASE_FRAMES = 14;

// Each advance: a cue word (anchored LEAD_FRAMES before it), or a rule. Words are matched in
// order through the take, each after the previous cue. The video ends on the track's last frame:
// the take's [[pause 5.0s]] tail is the end hold, so the audio always wins.
const PLAN = [
	["v2-cold-open", ["with", { cut: "VideoWrite" }]],
	["v2-title-card", ["VideoWrite", "video", { release: "technologies" }, "That"]],
	[
		"v2-web-tech-gallery",
		["any", "advanced", "Lottie", "even", "rendered", "VideoWrite", "Request"],
	],
	["v2-interactive-dev", ["and", "reloads", "One"]],
	["v2-pixel-perfect-export", ["your", "pixel-perfect", "not", "Your"]],
	["v2-voiceover-sync", ["The", "Edit", "resyncs", "And"]],
	["v2-any-coding-agent", ["every", "Install"]],
	["v2-install-cta", ["You'll", { end: "track" }]],
];

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const words = JSON.parse(readFileSync(join(VO_DIR, "timing.json"), "utf-8")).words.map((w) => ({
	word: w.word,
	start: w.start + PLACE_AT,
	end: w.end + PLACE_AT,
}));
const frameOf = (t) => Math.round(t * FPS);

let cursor = 0;
const find = (word) => {
	const i = words.findIndex((w, k) => k >= cursor && norm(w.word) === norm(word));
	if (i < 0) throw new Error(`no "${word}" after word ${cursor}`);
	cursor = i + 1;
	return words[i];
};

const table = {};
const notes = [];
let start = 0; // frames
for (const [id, cues] of PLAN) {
	const frames = cues.map((cue) => {
		if (typeof cue === "string") {
			const w = find(cue);
			notes.push(`${id} "${w.word}" ${w.start.toFixed(3)}`);
			return frameOf(w.start) - LEAD_FRAMES;
		}
		if (cue.cut) {
			// Peek: the next segment's first word, without consuming it.
			const i = words.findIndex((w, k) => k >= cursor && norm(w.word) === norm(cue.cut));
			if (i < 0) throw new Error(`no "${cue.cut}" after word ${cursor}`);
			return frameOf(words[i].start) - CUT_FRAMES;
		}
		if (cue.release) {
			const w = find(cue.release);
			return frameOf(w.end) + RELEASE_FRAMES;
		}
		const probe = spawnSync("ffprobe", [
			"-v",
			"error",
			"-show_entries",
			"format=duration",
			"-of",
			"default=nw=1:nk=1",
			TRACK_MP3,
		]);
		return frameOf(Number.parseFloat(String(probe.stdout)));
	});
	const rel = frames.map((f) => f - start);
	const values = rel.map((f) => Number((f / FPS).toFixed(3)));
	values.forEach((v, i) => {
		if (Math.round(v * FPS) !== rel[i]) throw new Error(`${id}[${i}] does not round to its frame`);
	});
	table[id] = values;
	start += rel[rel.length - 1];
}

const fmt = (values) => `[${values.join(", ")}]`;
for (const [id, values] of Object.entries(table)) console.log(`${id.padEnd(26)} ${fmt(values)}`);
console.log(`frames ${start} (${(start / FPS).toFixed(3)} s)`);
for (const n of notes) console.log(`  ${n}`);

if (process.argv.includes("--write")) {
	const swap = (file, id, values, voShift = 0) => {
		let src = readFileSync(file, "utf-8");
		const re = new RegExp(`("${id}": )\\[[^\\]]*\\]`);
		if (!re.test(src)) throw new Error(`${file}: no ${id}`);
		const shifted = values.map((v) => Number((v - voShift).toFixed(3)));
		src = src.replace(re, `$1${fmt(shifted)}`);
		writeFileSync(file, src);
	};
	for (const [id, values] of Object.entries(table)) {
		swap(TRACK_TS, id, values);
		// The voiceover's timing is the take's own (placed at 0): the cold open absorbs the shift.
		swap(VO_TS, id, values, id === "v2-cold-open" ? PLACE_AT : 0);
		const seg = join(DEMO, "segments", id, "index.ts");
		let src = readFileSync(seg, "utf-8");
		src = src.replace(/advances: \[[^\]]*\]/, `advances: ${fmt(values)}`);
		src = src.replace(/const ADV = \[[^\]]*\]/, `const ADV = ${fmt(values)}`);
		writeFileSync(seg, src);
		let program = readFileSync(PROGRAM_TS, "utf-8");
		program = program.replace(
			new RegExp(`(id: "${id}", name: "[^"]+", seconds: )[0-9.]+`),
			`$1${values[values.length - 1]}`,
		);
		writeFileSync(PROGRAM_TS, program);
	}
	console.log("wrote track.ts, voiceover.ts, the segments' advances and program.ts");
}
