/**
 * demo_v2: the timeline, its audio track and the sync contract between them.
 *
 * Structural checks plus the timing rules the build relies on: track timing is the
 * voiceover's timing shifted by the VO's placement in the track, every advance sits where
 * its VO cue says, and the typing SFX in the audio plan is placed on the same schedule the
 * cold open types with. These catch a re-timed take or an edited plan drifting out of sync.
 */

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

const SEGMENT_IDS = ["v2-cold-open", "v2-title-card", "v2-web-tech-gallery", "v2-interactive-dev"];

/**
 * The VO word each advance is cued on, per segment after the title card: every one sits 0.15s
 * before its word (a segment's last advance before the next segment's first word).
 */
const CUE_WORDS: Record<string, string[]> = {
	"v2-web-tech-gallery": [
		"any", // -> ECharts
		"advanced", // -> Three.js + Lottie
		"Three.js", // lock on the planet
		"Lottie", // lock on the rocket
		"even", // -> the product UI
		"rendered", // Customers, the note
		"If", // send, the toast
		"VideoWrite", // the claim lock ("Videowright supports it.")
		"Request", // exit: live dev's first word
	],
	"v2-interactive-dev": [
		"and", // Enter
		"reloads", // the hot reload
		"One", // exit: the export beat's first word
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
		]);
		expect(timeline.meta.style).toBeUndefined(); // the project default: motion-engineering
		const source = readFileSync(join(VIDEO, "timeline.ts"), "utf-8");
		expect(source).toContain('import "../../styles/motion-engineering/tokens.css";');
	});

	it("registers every custom transition it uses, and each file exists", () => {
		const config = readFileSync(join(DEMO, "videowright.config.ts"), "utf-8");
		for (const name of ["me-push", "me-split"]) {
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
		const shifted = (vo[first] ?? []).map((t) => Math.round((t + voCue.placeAt) * 100) / 100);
		expect(track.timing.perSegment[first]).toEqual(shifted);
		for (const id of rest) expect(track.timing.perSegment[id], id).toEqual(vo[id]);
	});

	it("advances land on their VO cues", () => {
		const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
		// Track time of the first `word` starting at or after `after` (track seconds).
		const at = (word: string, after = 0) => {
			const hit = words.find(
				(w) => norm(w.word) === norm(word) && w.start + voCue.placeAt >= after,
			);
			if (!hit) throw new Error(`no "${word}" after ${after}s`);
			return { start: hit.start + voCue.placeAt, end: hit.end + voCue.placeAt };
		};
		const lead = (advance: number, cue: number) => cue - advance;
		const timing = track.timing.perSegment;
		const [ready, cut] = timing["v2-cold-open"] ?? [];
		const [wordmark, web, release, exit] = (timing["v2-title-card"] ?? []).map((t) => t + cut);
		// The architecture's anchor: an advance sits 0.15s before its cue word (to the frame).
		const anchored = (advance: number, cue: number) =>
			expect(lead(advance, cue)).toBeCloseTo(0.15, 2);

		// "Video is ready" lands on "with a single prompt".
		const code = at("Code");
		const withCue = at("with", code.end);
		expect(ready).toBeGreaterThan(code.end);
		anchored(ready, withCue.start);
		// The hard cut falls in the breath between "prompt." and the title's "Videowright".
		const prompt = at("prompt", withCue.end);
		const title = at("VideoWrite", prompt.end);
		expect(cut).toBeGreaterThan(prompt.end + 0.2);
		expect(cut).toBeLessThan(title.start);
		// The wordmark rises onto "Videowright"; the HUD reads ahead on "web".
		anchored(wordmark, title.start);
		anchored(web, at("web", title.start).start);
		// The release follows "technologies."; the exit is anchored on the gallery's "That".
		const technologies = at("technologies", title.start);
		expect(release).toBeGreaterThan(technologies.end);
		const that = at("That", release);
		expect(that.start).toBeGreaterThan(technologies.end);
		expect(exit).toBeGreaterThan(release);
		anchored(exit, that.start);

		// Every later segment: each advance 0.15s before its cue word, in order.
		let start = exit;
		let after = that.start;
		for (const [id, cues] of Object.entries(CUE_WORDS)) {
			const advances = timing[id] ?? [];
			expect(advances, id).toHaveLength(cues.length);
			cues.forEach((word, i) => {
				const cue = at(word, after);
				expect(lead(start + advances[i], cue.start), `${id} [${i}] "${word}"`).toBeCloseTo(0.15, 2);
				after = cue.start;
			});
			start += advances[advances.length - 1];
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
		expect(existsSync(join(dirname(join(VIDEO, track.audio_file)), "plan_snapshot.md"))).toBe(true);
	});
});
