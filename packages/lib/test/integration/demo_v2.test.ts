/**
 * demo_v2: the timeline, its audio track and the sync contract between them.
 *
 * Structural checks plus the timing rules the build relies on: track timing is the
 * voiceover's timing shifted by the VO's placement in the track, every advance sits where
 * its VO cue says, and the typing SFX in the audio plan is placed on the same schedule the
 * cold open types with. These catch a re-timed take or an edited plan drifting out of sync.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { loadModule } from "../../src/cli/ts_loader.js";
import { validateAudioTrack, validateTiming } from "../../src/timeline/validateTiming.js";
import type { AudioTrack, Timeline, Voiceover } from "../../src/types.js";

const DEMO = resolve(__dirname, "../../../../examples/videowright_demo");
const VIDEO = join(DEMO, "videos/demo_v2");
const VO_DIR = join(VIDEO, "audio/originals/voiceovers/v1");
const SFX_DIR = join(VIDEO, "audio/originals/sfx/laptop_typing");

interface TypingCue {
	at: number;
	from: number;
	to: number;
}
interface TypingModule {
	COLD_OPEN: {
		cues: Record<string, TypingCue>;
		pasteAt: number;
		enterAt: number;
		settledAt: number;
	};
}
interface ProgramModule {
	PROGRAM: ReadonlyArray<{ id: string; name: string; seconds: number }>;
	FPS: number;
	frameCount(fps?: number): number;
	startOf(id: string, fps?: number): number;
}
interface PlanCue {
	name: string;
	source: string;
	slice: string;
	placeAt: number;
	snippet: string;
}

/** The cues of an audio plan (or snapshot): each `### Cue N -- name` block's fields. */
function parseCues(plan: string): PlanCue[] {
	const blocks = plan.split(/^### Cue \d+ -- /m).slice(1);
	return blocks.map((block) => {
		const field = (name: string) => block.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1] ?? "";
		const snippet =
			block
				.split("ffmpeg snippet:")[1]
				?.split("\n")
				.find((l) => l.trim()) ?? "";
		return {
			name: block.split("\n")[0].trim(),
			source: field("Source"),
			slice: field("Slice"),
			placeAt: Number.parseFloat(field("Place at")),
			snippet,
		};
	});
}

const SEGMENT_IDS = [
	"v2-cold-open",
	"v2-title-card",
	"v2-web-tech-gallery",
	"v2-interactive-dev",
	"v2-pixel-perfect-export",
	"v2-voiceover-sync",
	"v2-any-coding-agent",
	"v2-install-cta",
];

/** The calm hold after the last VO word before the video ends (s): the spec's ~5s end hold. */
const END_HOLD_S = 5;

/**
 * The VO word each advance is cued on, per segment after the title card: every one sits 0.15s
 * before its word (a segment's last advance before the next segment's first word). The last
 * segment's final advance is not a cue: it ends the video END_HOLD_S after the last word.
 */
const CUE_WORDS: Record<string, string[]> = {
	"v2-web-tech-gallery": [
		"any", // -> ECharts
		"advanced", // -> Three.js + Lottie
		"Lottie", // the rocket launches on the word
		"even", // -> the product UI
		"rendered", // Customers, the note
		"VideoWrite", // send, the toast, the spine completes ("Videowright supports it.")
		"Request", // exit: live dev's first word
	],
	"v2-interactive-dev": [
		"and", // Enter
		"reloads", // the hot reload
		"One", // exit: the export beat's first word
	],
	"v2-pixel-perfect-export": [
		"your", // Enter: the render runs
		"pixel-perfect", // the player opens on the title card
		"not", // the camera leans in, the render reads out
		"Your", // exit: the voiceover beat's first word
	],
	"v2-voiceover-sync": [
		"The", // line 2
		"Edit", // the cursor retypes line 3
		"resyncs", // the block re-times
		"And", // exit: the agents beat's first word
	],
	"v2-any-coding-agent": [
		"every", // the three agents arrive
		"Install", // exit: the end card's first word (the match cut)
	],
	"v2-install-cta": [
		"You'll", // the destination turns amber
	],
};

let timeline: Timeline;
let track: AudioTrack;
let voiceover: Voiceover;
let snapshot: string;
let voCue: PlanCue;
let words: Array<{ word: string; start: number; end: number }>;

beforeAll(async () => {
	timeline = (await loadModule(join(VIDEO, "timeline.ts"))).default as Timeline;
	track = timeline.default_audio_track as AudioTrack;
	voiceover = (await loadModule(join(VO_DIR, "voiceover.ts"))).default as Voiceover;
	snapshot = readFileSync(join(VIDEO, "audio/tracks/v1/plan_snapshot.md"), "utf-8");
	const vo = parseCues(snapshot).find((c) => c.source.includes("voiceovers/v1"));
	if (!vo) throw new Error("no VO cue in the plan snapshot");
	voCue = vo;
	words = JSON.parse(readFileSync(join(VO_DIR, "timing.json"), "utf-8")).words;
});

describe("demo_v2 timeline", () => {
	it("loads with the built v2 segments in order, each entered on its designed transition", () => {
		expect(timeline.segments.map((s) => s.id)).toEqual(SEGMENT_IDS);
		expect(timeline.segments.map((s) => s.transition)).toEqual([
			undefined,
			"cut", // the hook lands on the hard cut
			"me-push", // into the examples
			"me-split", // into the split screen, opening from its divider
			"me-sweep", // the instrument redraws: the preview to the shell that renders it
			"me-push", // into the exported file's internals: its script
			"me-sweep", // a new readout: the agents
			"cut", // the match cut: the agents' outline arrives on the end card's prompt box
		]);
		expect(timeline.meta.style).toBeUndefined(); // the project default: motion-engineering
		const source = readFileSync(join(VIDEO, "timeline.ts"), "utf-8");
		expect(source).toContain('import "../../styles/motion-engineering/tokens.css";');
	});

	it("registers every custom transition it uses, and each file exists", () => {
		const config = readFileSync(join(DEMO, "videowright.config.ts"), "utf-8");
		for (const name of ["me-sweep", "me-push", "me-split"]) {
			expect(config).toContain(`"${name}": () => import("./transitions/${name}.js")`);
			expect(existsSync(join(DEMO, "transitions", `${name}.ts`)), name).toBe(true);
		}
		// The split reads its line from the incoming scene, which declares it.
		const dev = readFileSync(join(DEMO, "segments/v2-interactive-dev/index.ts"), "utf-8");
		expect(dev).toContain("dataset.splitX");
	});

	it("every timeline segment has a segments/<id>/index.ts", () => {
		for (const { id } of timeline.segments) {
			expect(existsSync(join(DEMO, "segments", id, "index.ts")), id).toBe(true);
		}
	});

	it("each segment's own advances match the track's timing (so it plays sensibly in dev)", () => {
		for (const { id } of timeline.segments) {
			const source = readFileSync(join(DEMO, "segments", id, "index.ts"), "utf-8");
			const own = source
				.match(/advances: \[([^\]]+)\]/)?.[1]
				.split(",")
				.map(Number);
			expect(own, id).toEqual(track.timing.perSegment[id]);
			// A segment that paces sub-beats from its advances keeps a copy (const ADV = [...]):
			// it must be the same numbers, or a re-timed take would re-time only one of them.
			const copy = source.match(/const ADV = \[([^\]]+)\]/)?.[1];
			if (copy !== undefined) expect(copy.split(",").map(Number), `${id} ADV`).toEqual(own);
		}
	});

	it("every segment's advances are positive and ascend, in the track and in the segment", () => {
		for (const { id } of timeline.segments) {
			const source = readFileSync(join(DEMO, "segments", id, "index.ts"), "utf-8");
			const own = (source.match(/advances: \[([^\]]+)\]/)?.[1] ?? "").split(",").map(Number);
			for (const advances of [track.timing.perSegment[id] ?? [], own]) {
				expect(advances.length, id).toBeGreaterThan(0);
				expect(advances[0], id).toBeGreaterThan(0);
				for (let i = 1; i < advances.length; i++) {
					expect(advances[i], `${id} [${i}]`).toBeGreaterThan(advances[i - 1]);
				}
			}
		}
	});

	it("the video's own running order (components/v2/program.ts) is this timeline and track", async () => {
		const program = (await loadModule(
			join(DEMO, "components/v2/program.ts"),
		)) as unknown as ProgramModule;
		expect(program.PROGRAM.map((e) => e.id)).toEqual(timeline.segments.map((s) => s.id));
		const finals = SEGMENT_IDS.map((id) => (track.timing.perSegment[id] ?? []).at(-1));
		expect(program.PROGRAM.map((e) => e.seconds)).toEqual(finals);
		// The render captures round(final advance × fps) frames per segment: the export beat's
		// counter shows that total.
		const fps = timeline.meta.fps ?? 60;
		expect(program.FPS).toBe(fps);
		const frames = finals.reduce((n: number, s) => n + Math.round((s ?? 0) * fps), 0);
		expect(program.frameCount()).toBe(frames);
		expect(program.startOf("v2-voiceover-sync")).toBeCloseTo(
			finals.slice(0, 5).reduce((n: number, s) => n + Math.round((s ?? 0) * fps), 0) / fps,
			6,
		);
	});
});

describe("demo_v2 audio", () => {
	it("render pre-flight: the default track resolves, timing validates, and covers exactly the timeline's segments", () => {
		const audioPath = resolve(VIDEO, track.audio_file);
		expect(existsSync(audioPath)).toBe(true);
		expect(statSync(audioPath).size).toBeGreaterThan(100_000);
		expect(validateAudioTrack(track, VIDEO).ok).toBe(true);
		const result = validateTiming(track.timing, SEGMENT_IDS);
		expect(result).toEqual({ ok: true, warnings: [] });
		expect(Object.keys(track.timing.perSegment).sort()).toEqual([...SEGMENT_IDS].sort());
		// The track is the VO placed after the cold open's lead-in, end to end.
		const voLength = words[words.length - 1].end;
		expect(track.length_s).toBeGreaterThan(voCue.placeAt + voLength);
	});

	it("voiceover.ts names the ElevenLabs v4 Cosman-1 take and its files exist", () => {
		expect(voiceover.provider).toBe("elevenlabs");
		expect(voiceover.model).toBe("eleven_v4");
		expect(voiceover.voice).toBe("Cosman-1");
		expect(existsSync(resolve(VO_DIR, voiceover.audio_file))).toBe(true);
		expect(existsSync(resolve(VO_DIR, voiceover.provider_timing_file ?? ""))).toBe(true);
	});

	it("track timing is the voiceover timing shifted by the VO's placement", () => {
		const [first, ...rest] = SEGMENT_IDS;
		const vo = voiceover.timing.perSegment;
		const shifted = (vo[first] ?? []).map((t) => Number((t + voCue.placeAt).toFixed(3)));
		expect(track.timing.perSegment[first]).toEqual(shifted);
		for (const id of rest) expect(track.timing.perSegment[id], id).toEqual(vo[id]);
	});

	it("advances land on their VO cues, frame-exact", async () => {
		const program = (await loadModule(
			join(DEMO, "components/v2/program.ts"),
		)) as unknown as ProgramModule;
		const FPS = program.FPS;
		const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
		// Track time of the first `word` starting at or after `after` (track seconds).
		const at = (word: string, after = 0) => {
			const hit = words.find(
				(w) => norm(w.word) === norm(word) && w.start + voCue.placeAt >= after,
			);
			if (!hit) throw new Error(`no "${word}" after ${after}s`);
			return { start: hit.start + voCue.placeAt, end: hit.end + voCue.placeAt };
		};
		const timing = track.timing.perSegment;
		// The render fires advance a of a segment on frame startOf(id) × fps + round(a × fps).
		const frameOf = (id: string, i: number) =>
			Math.round(program.startOf(id) * FPS) + Math.round((timing[id] ?? [])[i] * FPS);
		// The architecture's anchor, to the frame: the advance's frame sits 0.150 s before its
		// cue word (within half a frame), and never further ahead than that (frame-rounded).
		const anchored = (id: string, i: number, cue: { start: number }, label: string) => {
			const frame = frameOf(id, i);
			expect(Math.abs(cue.start - frame / FPS - 0.15), label).toBeLessThanOrEqual(1 / 120 + 1e-9);
			expect((Math.round(cue.start * FPS) - frame) / FPS, label).toBeLessThanOrEqual(0.15 + 1e-9);
		};
		const seconds = (id: string, i: number) => frameOf(id, i) / FPS;

		// "Video is ready" lands on "with a single prompt".
		const code = at("Code");
		const withCue = at("with", code.end);
		expect(seconds("v2-cold-open", 0)).toBeGreaterThan(code.end);
		anchored("v2-cold-open", 0, withCue, 'cold open "with"');
		// The hard cut falls in the breath between "prompt." and the title's "Videowright".
		const prompt = at("prompt", withCue.end);
		const title = at("VideoWrite", prompt.end);
		const cut = seconds("v2-cold-open", 1);
		expect(cut).toBeGreaterThan(prompt.end + 0.2);
		expect(cut).toBeLessThan(title.start);
		// The wordmark rises onto "Videowright"; the tagline onto "video team".
		anchored("v2-title-card", 0, title, 'title "Videowright"');
		anchored("v2-title-card", 1, at("video", title.start), 'title "video"');
		// The release follows "technologies."; the exit is anchored on the gallery's "That".
		const technologies = at("technologies", title.start);
		expect(seconds("v2-title-card", 2)).toBeGreaterThan(technologies.end);
		const that = at("That", technologies.end);
		anchored("v2-title-card", 3, that, 'title exit "That"');

		// Every later segment: each advance 0.15s before its cue word, in order. The last
		// segment's final advance is the end hold (its own test).
		let after = that.start;
		const last = SEGMENT_IDS[SEGMENT_IDS.length - 1];
		for (const [id, cues] of Object.entries(CUE_WORDS)) {
			const advances = timing[id] ?? [];
			expect(advances, id).toHaveLength(cues.length + (id === last ? 1 : 0));
			cues.forEach((word, i) => {
				const cue = at(word, after);
				anchored(id, i, cue, `${id} [${i}] "${word}"`);
				after = cue.start;
			});
		}
	});

	it("ends the video END_HOLD_S after the last VO word, at the end of the track", () => {
		const timing = track.timing.perSegment;
		const fps = timeline.meta.fps ?? 60;
		const frames = SEGMENT_IDS.map((id) => Math.round(((timing[id] ?? []).at(-1) ?? 0) * fps));
		const end = frames.reduce((a, b) => a + b, 0) / fps;
		const lastWord = words[words.length - 1].end + voCue.placeAt;
		// The track holds the end hold (the take's [[pause 5.0s]] tail, measured by retime from
		// the take's real silence, a few ms past the STT word end), so the final advance lands on
		// the end of the audio, as the sync rule asks: the render neither pads nor cuts.
		expect(Math.abs(end - track.length_s)).toBeLessThanOrEqual(1 / (2 * fps) + 0.005);
		// The full hold after the last word, and no dead tail after it.
		expect(Math.abs(end - lastWord - END_HOLD_S)).toBeLessThan(0.1);
		// The hold is the take's own tail marker.
		const script = readFileSync(join(VO_DIR, "provider_script.md"), "utf-8");
		expect(script.trimEnd().endsWith(`[[pause ${END_HOLD_S.toFixed(1)}s]]`)).toBe(true);
	});

	it("the voiceover beat's waveform is this track's", async () => {
		const env = (await loadModule(
			join(DEMO, "segments/v2-voiceover-sync/envelope.ts"),
		)) as unknown as {
			ENVELOPE: string;
			ENVELOPE_STEP_S: number;
			TRACK_SHA256: string;
		};
		expect(env.ENVELOPE_STEP_S).toBe(0.1);
		expect(env.ENVELOPE).toMatch(/^[0-9a-z]+$/);
		const sha = createHash("sha256")
			.update(readFileSync(resolve(VIDEO, track.audio_file)))
			.digest("hex");
		expect(
			env.TRACK_SHA256,
			"envelope.ts is stale: re-run specs/projects/demo_v2/tools/envelope.sh",
		).toBe(sha);
		// One level per 0.1s, covering the track.
		expect(Math.abs(env.ENVELOPE.length - track.length_s / env.ENVELOPE_STEP_S)).toBeLessThan(1);
		// Speech where the VO speaks: the bin under the export beat's "command" is loud.
		const command = words.find((w) => w.word === "command");
		if (!command) throw new Error('no "command" in timing.json');
		const bin = Math.floor(((command.start + command.end) / 2 + voCue.placeAt) * 10);
		expect(Number.parseInt(env.ENVELOPE[bin], 36)).toBeGreaterThan(20);
	});

	it("the voiceover beat's word times are timing.json's, from each line's window start", () => {
		const source = readFileSync(join(DEMO, "segments/v2-voiceover-sync/index.ts"), "utf-8");
		const table = (name: string) =>
			JSON.parse(
				(source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`))?.[1] ?? "[]").replace(
					/,\s*\]/g,
					"]",
				),
			) as number[][];
		const starts = table("WORD_MS");
		const spans = table("LINE3_WORD_MS");
		const lines = (source.match(/voiceover:\s*"([^"]+)"/)?.[1] ?? "")
			.split(/(?<=\.) /)
			.map((line) => line.split(" ").length);
		expect(lines).toEqual([starts[0]?.length, starts[1]?.length, spans.length]);
		let i = words.findIndex((w) => w.word === "Your");
		expect(i, 'no "Your" in timing.json').toBeGreaterThan(-1);
		const rel = lines.map((count) => {
			const line = words.slice(i, i + count);
			i += count;
			const from = line[0].start - 0.15;
			return line.map((w) => [
				Math.round((w.start - from) * 1000),
				Math.round((w.end - from) * 1000),
			]);
		});
		expect(rel[0].map(([start]) => start)).toEqual(starts[0]);
		expect(rel[1].map(([start]) => start)).toEqual(starts[1]);
		expect(rel[2]).toEqual(spans);
	});

	it("the voiceover beat's lane follows the beat's start", () => {
		const source = readFileSync(join(DEMO, "segments/v2-voiceover-sync/index.ts"), "utf-8");
		expect(source).toMatch(/const LANE = \{[^}]*t0: Math\.floor\(START\) - 2,/);
	});

	it("the agent logos are the byte-identical allowed assets", () => {
		for (const name of ["claude", "codex", "opencode"]) {
			const original = join(DEMO, "segments/any-coding-agent/icons", `${name}.svg`);
			const copy = join(DEMO, "segments/v2-any-coding-agent/icons", `${name}.svg`);
			expect(readFileSync(copy).equals(readFileSync(original)), name).toBe(true);
		}
	});

	it("the gallery's Lottie is the byte-identical allowed asset, and the demo declares ECharts", () => {
		const original = join(DEMO, "rocket-launch.json");
		const copy = join(DEMO, "segments/v2-web-tech-gallery/rocket-launch.json");
		expect(readFileSync(copy).equals(readFileSync(original))).toBe(true);
		const pkg = JSON.parse(readFileSync(join(DEMO, "package.json"), "utf-8")) as {
			dependencies: Record<string, string>;
		};
		expect(pkg.dependencies.echarts).toMatch(/^\^6\./);
	});

	it("typing SFX is the byte-identical allowed asset and sfx.ts records its measured length", async () => {
		const original = join(DEMO, "videos/demo_video/audio/originals/sfx/laptop_typing/audio.mp3");
		expect(readFileSync(join(SFX_DIR, "audio.mp3")).equals(readFileSync(original))).toBe(true);
		const sfx = (await loadModule(join(SFX_DIR, "sfx.ts"))).default as { length_s: number };
		expect(sfx.length_s).toBe(3.0);
	});

	it("places the typing SFX on the cold open's typing schedule", async () => {
		const { COLD_OPEN } = (await loadModule(
			join(DEMO, "components/v2/typing.ts"),
		)) as unknown as TypingModule;
		const typing = parseCues(snapshot).filter((c) => c.source.includes("sfx/laptop_typing"));
		const scheduled = Object.values(COLD_OPEN.cues);
		expect(typing).toHaveLength(scheduled.length);
		for (const cue of scheduled) {
			const plan = typing.find((c) => c.placeAt === cue.at);
			expect(plan, `no plan cue at ${cue.at}s`).toBeDefined();
			if (!plan) continue;
			const slice = plan.slice === "full file" ? "full file" : plan.slice.split("-").map(Number);
			expect(slice).toEqual(cue.from === 0 && cue.to >= 3 ? "full file" : [cue.from, cue.to]);
			expect(plan.snippet).toContain(`adelay=${Math.round(cue.at * 1000)}:all=1`);
		}
		// The paste and Enter keys sit on the moments the cold open shows them.
		expect(COLD_OPEN.cues.paste.at).toBeLessThan(COLD_OPEN.pasteAt);
		expect(COLD_OPEN.cues.enter.at).toBeLessThan(COLD_OPEN.enterAt);
	});

	it("never cues 'Video is ready' before the cold open's session has played out", async () => {
		// An earlier first advance makes the script jump ahead (the dev path for an early Next),
		// which a render must never do: re-tuned pauses or VO placement could cause it.
		const { COLD_OPEN } = (await loadModule(
			join(DEMO, "components/v2/typing.ts"),
		)) as unknown as TypingModule;
		const [ready] = track.timing.perSegment["v2-cold-open"] ?? [];
		expect(ready * 1000).toBeGreaterThanOrEqual(COLD_OPEN.settledAt * 1000);
	});

	it("the final mix command takes every cue's source and fills the track placeholder", () => {
		const command = snapshot.split("### Final mix command")[1];
		for (const cue of parseCues(snapshot)) {
			expect(command, cue.name).toContain(`-i ${cue.source}audio.mp3`);
			expect(command, cue.name).toContain(cue.snippet.split(" [")[0].replace(/^\[[^\]]+\] /, ""));
		}
		expect(command).toContain("{TRACK_OUT}");
		expect(command).toContain("loudnorm=I=-14");
	});

	it("masters in two passes: measure, then one linear gain with the measured values", () => {
		const command = snapshot.split("### Final mix command")[1].split("```bash")[1] ?? "";
		const measure = command.indexOf("print_format=json");
		const apply = command.indexOf("linear=true");
		expect(measure, "pass 1 measures").toBeGreaterThan(-1);
		expect(apply, "pass 2 applies a linear gain after it").toBeGreaterThan(measure);
		for (const value of [
			"measured_I",
			"measured_TP",
			"measured_LRA",
			"measured_thresh",
			"offset",
		]) {
			expect(command.slice(apply), value).toContain(`${value}=$(m `);
		}
		// ...and the build fails unless pass 2 stayed linear (loudnorm silently falls back to dynamic mode).
		expect(command.slice(apply)).toContain(`grep -q '"normalization_type" : "linear"'`);
		// Both passes target -14 LUFS under the -1.5 dBTP ceiling.
		expect(command.match(/loudnorm=I=-14:TP=-1\.5/g)).toHaveLength(2);
		expect(existsSync(join(dirname(join(VIDEO, track.audio_file)), "plan_snapshot.md"))).toBe(true);
	});
});
