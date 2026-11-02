#!/usr/bin/env node
// Joins the narration from its takes into one file: audio/originals/voiceovers/assembled/
// (audio.wav, timing.json, pieces.json). Run from the video folder: node audio/assemble.mjs
//
// The narration is round 2's one take (v2: Cosman-1, ElevenLabs v4) with the voice beat's two
// takes placed in it after "timed to every word.": the Then line (voice_then: Asher, ElevenLabs
// v2, raised to the loudness of the line it is compared with) and the Now line (voice_now). Until v2 is in, v1's take stands in (round 1's wording for the opener and the
// first two pairs) with the separate voice_now take, so the video can be built and checked;
// re-run this once v2/timing.json exists.
//
// Each piece keeps EDGE seconds of its take's own silence around its words; `gap` is the
// silence from the previous piece's last word to this piece's first word, so pauses are exact.
// Word times in timing.json are the assembled file's times (the track places it at 0s).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const VO = "audio/originals/voiceovers";
const OUT = join(VO, "assembled");
const RATE = 44100;
const EDGE = 0.2;

const HAVE_V2 = existsSync(join(VO, "v2/timing.json"));
// The voice beat: the narration-sync pair's Now clip holds ~4s after its sweep (0.15s before its
// "Now,"), then the voice beat opens on a breath before the old voice; the new voice answers.
const VOICE_THEN = {
	name: "voice_then",
	src: "voice_then",
	first: ["Previously,", 1],
	last: ["cues.", 1],
	gap: 2.6,
	match: "voice_now",
};
const PIECES = HAVE_V2
	? [
			// Round 2's one take (v2), split where the Asher line goes.
			{ name: "narration", src: "v2", fromStart: true, last: ["word.", 1] },
			VOICE_THEN,
			{ name: "voice_now", src: "voice_now", first: ["This", 1], last: ["message.", 1], gap: 1.3 },
			{ name: "cta", src: "v2", first: ["Both", 1], toEnd: true, gap: 1.5 },
		]
	: [
			// Until v2 is in: v1's lines stand in (the opener and the first two pairs are round 1's
			// wording), and the voice beat's Now line is its separate take (voice_now).
			{ name: "narration", src: "v1", fromStart: true, last: ["word.", 1] },
			VOICE_THEN,
			{ name: "voice_now", src: "voice_now", first: ["This", 1], last: ["message.", 1], gap: 1.3 },
			{ name: "cta", src: "v1", first: ["Both", 1], toEnd: true, gap: 1.5 },
		];

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const sh = (cmd, args) =>
	execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const words = (src) => JSON.parse(readFileSync(join(VO, src, "timing.json"), "utf8")).words;
const duration = (file) =>
	Number(
		sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]),
	);
/** Integrated loudness (LUFS) of a stretch of a file. */
const integrated = (file, from, to) => {
	const r = execFileSync(
		"sh",
		[
			"-c",
			`ffmpeg -hide_banner -nostats -ss ${from} -to ${to} -i "${file}" -af ebur128 -f null - 2>&1 | sed -n 's/^ *I: *\\(-\\{0,1\\}[0-9.]*\\) LUFS/\\1/p' | tail -1`,
		],
		{ encoding: "utf8" },
	);
	if (!r.trim()) throw new Error(`no loudness for ${file}`);
	return Number(r.trim());
};

/** The nth (1-based) word matching `w` in a take, counted after the word `after` if given. */
function find(list, [w, n, after]) {
	let i = after ? find(list, [after, 1]) + 1 : 0;
	let seen = 0;
	for (; i < list.length; i++) {
		if (norm(list[i].word) === norm(w) && ++seen === n) return i;
	}
	throw new Error(`no occurrence ${n} of "${w}"${after ? ` after "${after}"` : ""}`);
}

// Resolve every piece: its cut, its words, its gain.
const resolved = PIECES.map((p) => {
	const list = words(p.src);
	const file = join(VO, p.src, "audio.mp3");
	const i0 = p.fromStart ? 0 : find(list, p.first);
	const i1 = p.toEnd ? list.length - 1 : find(list, p.last);
	const from = p.fromStart ? 0 : Math.max(0, list[i0].start - EDGE);
	const to = p.toEnd ? duration(file) : list[i1].end + EDGE;
	if (!p.fromStart && i0 > 0 && list[i0 - 1].end > from)
		throw new Error(`${p.name}: cut at ${from} is inside a word`);
	if (!p.toEnd && i1 < list.length - 1 && list[i1 + 1].start < to)
		throw new Error(`${p.name}: cut at ${to} is inside a word`);
	return { ...p, list, file, i0, i1, from, to };
});
for (const p of resolved) {
	if (!p.match) continue;
	const other = resolved.find((q) => q.name === p.match);
	const mine = integrated(p.file, p.list[p.i0].start, p.list[p.i1].end);
	const theirs = integrated(other.file, other.list[other.i0].start, other.list[other.i1].end);
	p.gainDb = Math.round((theirs - mine) * 10) / 10;
	console.log(
		`${p.name}: ${mine} LUFS, ${p.match}: ${theirs} LUFS -> ${p.gainDb >= 0 ? "+" : ""}${p.gainDb} dB`,
	);
}

// Place them: sample-exact, each piece's first word `gap` after the previous piece's last word.
const tmp = mkdtempSync(join(tmpdir(), "fm-assemble-"));
const parts = [];
const outWords = [];
const pieces = [];
let cursor = 0; // samples written
let prevLastEnd = 0; // seconds, the previous piece's last word end (output time)
resolved.forEach((p, k) => {
	const lead = p.list[p.i0].start - p.from;
	const at = k === 0 ? 0 : prevLastEnd + p.gap - lead;
	const atSamples = Math.round(at * RATE);
	if (atSamples < cursor)
		throw new Error(`${p.name}: gap ${p.gap}s is shorter than the kept edges`);
	if (atSamples > cursor) {
		const silence = join(tmp, `s${k}.wav`);
		sh("ffmpeg", [
			"-v",
			"error",
			"-y",
			"-f",
			"lavfi",
			"-i",
			`anullsrc=r=${RATE}:cl=mono`,
			"-t",
			String((atSamples - cursor) / RATE),
			"-c:a",
			"pcm_s16le",
			silence,
		]);
		parts.push(silence);
		cursor = atSamples;
	}
	const wav = join(tmp, `p${k}.wav`);
	const gain = p.gainDb ? `,volume=${p.gainDb}dB` : "";
	sh("ffmpeg", [
		"-v",
		"error",
		"-y",
		"-ss",
		String(p.from),
		"-to",
		String(p.to),
		"-i",
		p.file,
		"-af",
		`aresample=${RATE}${gain}`,
		"-ac",
		"1",
		"-c:a",
		"pcm_s16le",
		wav,
	]);
	const samples = Math.round(duration(wav) * RATE);
	parts.push(wav);
	const shift = cursor / RATE - p.from;
	const first = outWords.length;
	for (let i = p.i0; i <= p.i1; i++) {
		const w = p.list[i];
		outWords.push({ word: w.word, start: round(w.start + shift), end: round(w.end + shift) });
	}
	pieces.push({
		name: p.name,
		src: p.src,
		at: round(cursor / RATE),
		from: round(p.from),
		to: round(p.to),
		gainDb: p.gainDb ?? 0,
		words: [first, outWords.length - 1],
	});
	cursor += samples;
	prevLastEnd = outWords[outWords.length - 1].end;
});

mkdirSync(OUT, { recursive: true });
const list = join(tmp, "list.txt");
writeFileSync(list, parts.map((f) => `file '${f}'`).join("\n"));
sh("ffmpeg", [
	"-v",
	"error",
	"-y",
	"-f",
	"concat",
	"-safe",
	"0",
	"-i",
	list,
	"-c:a",
	"pcm_s16le",
	join(OUT, "audio.wav"),
]);
rmSync(tmp, { recursive: true, force: true });
writeFileSync(join(OUT, "timing.json"), `${JSON.stringify({ words: outWords }, null, "\t")}\n`);
writeFileSync(
	join(OUT, "pieces.json"),
	`${JSON.stringify({ standIn: !HAVE_V2, pieces }, null, "\t")}\n`,
);
console.log(
	`${HAVE_V2 ? "" : "[stand-in opening from v1] "}wrote ${OUT}/audio.wav (${(cursor / RATE).toFixed(3)}s, ${outWords.length} words)`,
);
for (const p of pieces)
	console.log(
		`  ${p.name.padEnd(15)} at ${p.at.toFixed(3)}s  ${p.src} ${p.from}-${p.to}${p.gainDb ? `  ${p.gainDb} dB` : ""}`,
	);

function round(t) {
	return Math.round(t * 1000) / 1000;
}
