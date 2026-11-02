import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { loadModule } from "../../src/cli/ts_loader.js";

// The demo_v2 kit (examples/videowright_demo/components/v2): the pure parts (camera, typing
// schedule), and source rules every v2 file must keep (legibility floor, render safety,
// imports, the logo asset).

const DEMO = resolve(__dirname, "../../../../examples/videowright_demo");
const KIT = join(DEMO, "components/v2");

interface Camera {
	x: number;
	y: number;
	z: number;
}
interface CameraKey extends Camera {
	t: number;
	ease?: (p: number) => number;
}
interface Motion {
	createTicker(clock: () => number, signal: AbortSignal): Ticker;
	cameraAt(keys: CameraKey[], t: number): Camera;
	cameraTransform(cam: Camera): string;
	IDENTITY: Camera;
}
type Tick = (t: number) => boolean;
interface Ticker {
	now(): number;
	add(tick: Tick): void;
}
interface Hud {
	decode(
		ticker: Ticker,
		el: { textContent: string | null },
		text: string,
		start: number,
		opts?: { perChar?: number; signal?: AbortSignal },
	): void;
}
interface Typing {
	LAPTOP_TYPING_ONSETS: readonly number[];
	COLD_OPEN: {
		prompt: readonly string[];
		cues: Record<string, { at: number; from: number; to: number }>;
		pasteAt: number;
		enterAt: number;
		afterEnter: { say: number; tool2: number; resultLag: number; pullBack: number };
		reply: { text: string; words: number; every: number };
		settledAt: number;
	};
	spreadOver(chars: number, onsets: readonly number[]): number[];
	typeSchedule(
		text: string,
		start: number,
		end: number,
		seed?: number,
		rhythm?: { jitter?: number; beat?: number; beatAfter?: RegExp },
	): number[];
	charsAt(times: readonly number[], t: number): number;
	cueOnsets(cues: Array<{ at: number; from: number; to: number }>): number[];
	coldOpenCharTimes(): number[];
}

interface WrappedLine {
	text: string;
	start: number;
}
interface Agent {
	wrapColumns(text: string, cols: number): string[];
	wrapSpans(text: string, cols: number): WrappedLine[];
	typedLines(
		lines: readonly WrappedLine[],
		chars: number,
	): { shown: number[]; caretLine: number; caretCol: number };
}
interface Gear {
	cx: number;
	cy: number;
	teeth: number;
	r: number;
	phase: number;
	ratio: number;
}
interface Gears {
	gearTrain(
		first: { x: number; y: number; phase?: number },
		specs: ReadonlyArray<{ teeth: number; from?: number; angle?: number }>,
		module: number,
	): Gear[];
	TRAIN: ReadonlyArray<{ teeth: number; from?: number; angle?: number }>;
	MODULE: number;
}

const GALLERY = join(DEMO, "segments/v2-web-tech-gallery");

let motion: Motion;
let typing: Typing;
let hud: Hud;
let agent: Agent;
let gears: Gears;

beforeAll(async () => {
	motion = (await loadModule(join(KIT, "motion.ts"))) as unknown as Motion;
	typing = (await loadModule(join(KIT, "typing.ts"))) as unknown as Typing;
	hud = (await loadModule(join(KIT, "hud.ts"))) as unknown as Hud;
	agent = (await loadModule(join(KIT, "agent.ts"))) as unknown as Agent;
	gears = (await loadModule(join(GALLERY, "gears.ts"))) as unknown as Gears;
});

/** A ticker driven by hand: step(t) runs every tick at time t, like one rAF frame. */
function manualTicker() {
	let now = 0;
	let ticks: Tick[] = [];
	return {
		now: () => now,
		add(tick: Tick) {
			if (tick(now)) ticks.push(tick);
		},
		step(t: number) {
			now = t;
			ticks = ticks.filter((tick) => tick(t));
		},
		run(from: number, to: number) {
			for (let t = from; t <= to; t += 16) this.step(t);
		},
	};
}

describe("camera", () => {
	const keys: CameraKey[] = [
		{ t: 1000, x: 500, y: 300, z: 2 },
		{ t: 2000, x: 960, y: 540, z: 1, ease: (p) => p },
	];

	it("holds the first and last keys and eases between them", () => {
		expect(motion.cameraAt(keys, 0)).toEqual({ x: 500, y: 300, z: 2 });
		expect(motion.cameraAt(keys, 5000)).toEqual({ x: 960, y: 540, z: 1 });
		const mid = motion.cameraAt(keys, 1500);
		expect(mid.x).toBeCloseTo(730);
		expect(mid.y).toBeCloseTo(420);
		// Zoom interpolates in log space: halfway from 2x to 1x is sqrt(2).
		expect(mid.z).toBeCloseTo(Math.SQRT2);
		// The default ease is an in-out: slow off the first key.
		const soft = motion.cameraAt([keys[0], { ...keys[1], ease: undefined }], 1100);
		expect(soft.x - 500).toBeLessThan((960 - 500) * 0.1);
	});

	it("is the identity at the frame centre, zoom 1", () => {
		expect(motion.cameraTransform(motion.IDENTITY)).toBe(
			"translate(0.00px, 0.00px) scale(1.00000)",
		);
		// A 2x camera on (500, 300) puts that point at the frame centre.
		expect(motion.cameraTransform({ x: 500, y: 300, z: 2 })).toBe(
			"translate(-40.00px, -60.00px) scale(2.00000)",
		);
	});
});

describe("HUD decode", () => {
	it("leaves its readout alone until it starts", () => {
		const ticker = manualTicker();
		const el = { textContent: "UP NEXT" };
		hud.decode(ticker, el, "LOCK X 0320", 500);
		ticker.run(0, 480);
		expect(el.textContent).toBe("UP NEXT");
		ticker.run(500, 1200);
		expect(el.textContent).toBe("LOCK X 0320");
	});

	it("keeps an earlier-scheduled decode until a later one starts", () => {
		const ticker = manualTicker();
		const el = { textContent: "" };
		hud.decode(ticker, el, "LOCK X 0320 Y 0526", 640);
		ticker.run(0, 470);
		// Scheduled while the first is still pending, due well after it has resolved.
		hud.decode(ticker, el, "TARGET LOCKED", 1790);
		ticker.run(486, 1700);
		expect(el.textContent).toBe("LOCK X 0320 Y 0526");
		ticker.run(1716, 2600);
		expect(el.textContent).toBe("TARGET LOCKED");
	});

	it("hands its readout to a newer decode that starts while it is running", () => {
		const ticker = manualTicker();
		const el = { textContent: "" };
		hud.decode(ticker, el, "A VERY LONG FIRST READOUT", 0);
		ticker.run(0, 96);
		hud.decode(ticker, el, "SECOND", ticker.now());
		ticker.run(112, 1500);
		expect(el.textContent).toBe("SECOND");
	});

	it("lets the decode scheduled last win, even when an older one starts later", () => {
		// Three decodes scheduled together, the last one due first: it still owns the readout.
		const ticker = manualTicker();
		const el = { textContent: "" };
		hud.decode(ticker, el, "LOCK X 0320 Y 0526", 640);
		hud.decode(ticker, el, "TARGET LOCKED", 1320);
		hud.decode(ticker, el, "UP NEXT · 03 WEB TECH", 0);
		ticker.run(0, 3000);
		expect(el.textContent).toBe("UP NEXT · 03 WEB TECH");
	});

	it("drops a decode whose segment's signal aborts before it starts", () => {
		const ticker = manualTicker();
		const el = { textContent: "KEEP" };
		const segment = new AbortController();
		hud.decode(ticker, el, "STALE", 300, { signal: segment.signal });
		segment.abort();
		ticker.run(0, 1000);
		expect(el.textContent).toBe("KEEP");
	});

	it("finishes a decode whose segment's signal aborts mid-way (no scrambled readout)", () => {
		// The persistent HUD outlives segments: a segment unmounting while one of its readouts
		// decodes must not freeze the shared readout on noise.
		const ticker = manualTicker();
		const el = { textContent: "" };
		const segment = new AbortController();
		const text = "LOCK X 0320 Y 0526";
		hud.decode(ticker, el, text, 0, { signal: segment.signal });
		ticker.run(0, 96);
		expect(el.textContent).not.toBe(text);
		segment.abort();
		ticker.run(112, 1500);
		expect(el.textContent).toBe(text);
	});
});

describe("ticker", () => {
	it("keeps a tick added while a frame is running", () => {
		const frames: Array<() => void> = [];
		const raf = globalThis.requestAnimationFrame;
		globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
			frames.push(() => cb(0));
			return frames.length;
		};
		try {
			let now = 0;
			const ticker = motion.createTicker(() => now, new AbortController().signal);
			const seen: number[] = [];
			ticker.add((t) => {
				if (t === 16) {
					ticker.add((u) => {
						seen.push(u);
						return true;
					});
				}
				return t < 16;
			});
			for (const t of [16, 32, 48]) {
				now = t;
				frames.shift()?.();
			}
			// Added during the frame at 16 (run once by add), then on every later frame.
			expect(seen).toEqual([16, 32, 48]);
		} finally {
			globalThis.requestAnimationFrame = raf;
		}
	});
});

describe("cold open typing", () => {
	it("types one character per scheduled time, increasing, on the SFX's keystrokes", () => {
		const times = typing.coldOpenCharTimes();
		const prompt = typing.COLD_OPEN.prompt.join("");
		expect(times).toHaveLength(prompt.length);
		for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
		const keys = typing.cueOnsets([typing.COLD_OPEN.cues.typing, typing.COLD_OPEN.cues.typingTail]);
		// The first and last characters land exactly on the first and last keys.
		expect(times[0]).toBe(Math.round(keys[0] * 1000));
		expect(times[times.length - 1]).toBe(Math.round(keys[keys.length - 1] * 1000));
	});

	it("splits the prompt at the comma, across the SFX's breath", () => {
		const times = typing.coldOpenCharTimes();
		const first = typing.COLD_OPEN.prompt[0];
		expect(first.endsWith(",")).toBe(true);
		const gaps = times.slice(1).map((t, i) => t - times[i]);
		const longest = gaps.indexOf(Math.max(...gaps));
		expect(longest).toBe(first.length - 1);
		expect(gaps[longest]).toBeGreaterThan(200);
	});

	it("pastes and submits after the last key, before the VO's first word", () => {
		const times = typing.coldOpenCharTimes();
		const { pasteAt, enterAt } = typing.COLD_OPEN;
		expect(pasteAt * 1000).toBeGreaterThan(times[times.length - 1]);
		expect(enterAt).toBeGreaterThan(pasteAt);
		// The paste and Enter cues each play exactly one key, sounding on the frame that shows it.
		const { paste, enter } = typing.COLD_OPEN.cues;
		expect(typing.cueOnsets([paste])).toHaveLength(1);
		expect(typing.cueOnsets([paste])[0]).toBeCloseTo(pasteAt, 3);
		expect(typing.cueOnsets([enter])).toHaveLength(1);
		expect(typing.cueOnsets([enter])[0]).toBeCloseTo(enterAt, 3);
	});

	it("spreads characters over keystrokes by keystroke index", () => {
		expect(typing.spreadOver(3, [0, 1])).toEqual([0, 500, 1000]);
		expect(typing.spreadOver(2, [0, 0.1, 0.5])).toEqual([0, 500]);
		expect(typing.spreadOver(1, [0.2, 0.4])).toEqual([200]);
		expect(typing.spreadOver(0, [0.2])).toEqual([]);
	});

	it("has played out (reply streamed, tools in, camera at rest) by settledAt", () => {
		const { enterAt, afterEnter, reply, settledAt } = typing.COLD_OPEN;
		const chunks = Math.ceil(reply.text.split(" ").length / reply.words);
		const replyEnd = enterAt + afterEnter.say + (chunks - 1) * reply.every;
		expect(settledAt).toBeGreaterThanOrEqual(replyEnd);
		expect(settledAt).toBeGreaterThanOrEqual(enterAt + afterEnter.tool2 + afterEnter.resultLag);
		expect(settledAt).toBeGreaterThanOrEqual(enterAt + afterEnter.pullBack);
	});

	it("knows the SFX's keystrokes in order and inside the file", () => {
		const onsets = typing.LAPTOP_TYPING_ONSETS;
		for (let i = 1; i < onsets.length; i++) expect(onsets[i]).toBeGreaterThan(onsets[i - 1]);
		expect(onsets[onsets.length - 1]).toBeLessThan(3.03);
	});
});

describe("typing on a seeded rhythm", () => {
	const text = "npx videowright render --output explainer.mp4";

	it("types every character in order, first on start and last on end", () => {
		const times = typing.typeSchedule(text, 100, 900, 5);
		expect(times).toHaveLength(text.length);
		expect(times[0]).toBe(100);
		expect(times[times.length - 1]).toBeCloseTo(900, 9);
		for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
	});

	it("is the same on every call (seeded, no Math.random) and differs by seed", () => {
		expect(typing.typeSchedule(text, 0, 1000, 5)).toEqual(typing.typeSchedule(text, 0, 1000, 5));
		expect(typing.typeSchedule(text, 0, 1000, 5)).not.toEqual(
			typing.typeSchedule(text, 0, 1000, 6),
		);
	});

	it("re-paces with its window: a longer span stretches every gap in proportion", () => {
		const short = typing.typeSchedule(text, 0, 800, 5);
		const long = typing.typeSchedule(text, 0, 1600, 5);
		long.forEach((t, i) => expect(t).toBeCloseTo(short[i] * 2, 9));
	});

	it("waits longer on the key after a space than its average key", () => {
		const times = typing.typeSchedule(text, 0, 1000, 5);
		const gaps = times.slice(1).map((t, i) => t - times[i]);
		const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
		const afterSpaces = gaps.filter((_, i) => text[i] === " ");
		expect(afterSpaces.reduce((a, b) => a + b, 0) / afterSpaces.length).toBeGreaterThan(mean);
	});

	it("takes a rhythm: the jitter's bound and a longer beat after chosen characters", () => {
		const request = "update the title card (name, tagline), and add some motion";
		const times = typing.typeSchedule(request, 0, 1000, 3, {
			jitter: 0.3,
			beat: 5,
			beatAfter: /[,)]/,
		});
		const gaps = times.slice(1).map((t, i) => t - times[i]);
		const plain = gaps.filter((_, i) => !/[,)]/.test(request[i]));
		const beats = gaps.filter((_, i) => /[,)]/.test(request[i]));
		// ±30%: no plain gap is more than 1.3/0.7 of another.
		expect(Math.max(...plain) / Math.min(...plain)).toBeLessThanOrEqual(1.3 / 0.7 + 1e-9);
		expect(Math.min(...beats)).toBeGreaterThan(Math.max(...plain));
	});

	it("handles empty and one-character text", () => {
		expect(typing.typeSchedule("", 0, 100)).toEqual([]);
		expect(typing.typeSchedule("x", 40, 100)).toEqual([40]);
	});

	it("counts the characters due by a time", () => {
		const times = [0, 100, 200];
		expect(typing.charsAt(times, -1)).toBe(0);
		expect(typing.charsAt(times, 0)).toBe(1);
		expect(typing.charsAt(times, 150)).toBe(2);
		expect(typing.charsAt(times, 500)).toBe(3);
	});
});

describe("agent pane wrapping", () => {
	it("wraps at word boundaries, never past the column count, and keeps every word", () => {
		const prompt =
			"update the title card to our latest branding (name, tagline, design guide, colors), and add some motion";
		const lines = agent.wrapColumns(prompt, 32);
		expect(lines).toEqual([
			"update the title card to our",
			"latest branding (name, tagline,",
			"design guide, colors), and add",
			"some motion",
		]);
		for (const line of lines) expect(line.length).toBeLessThanOrEqual(32);
		expect(lines.join(" ")).toBe(prompt);
	});

	it("splits a word longer than a line", () => {
		expect(agent.wrapColumns("ab segments/title-card.ts", 10)).toEqual([
			"ab",
			"segments/t",
			"itle-card.",
			"ts",
		]);
		expect(agent.wrapColumns("", 10)).toEqual([""]);
	});

	it("knows where each wrapped line starts in the text", () => {
		const text = "ab segments/title-card.ts ok";
		const spans = agent.wrapSpans(text, 10);
		expect(spans.map((l) => l.text)).toEqual(["ab", "segments/t", "itle-card.", "ts ok"]);
		for (const line of spans)
			expect(text.slice(line.start, line.start + line.text.length)).toBe(line.text);
	});

	it("types through a split word without charging a separator", () => {
		const spans = agent.wrapSpans("ab segments/title-card.ts", 10);
		// "ab " typed, then "segments/t" and 3 more: the caret is 3 into the split's second line.
		const typed = agent.typedLines(spans, 3 + 10 + 3);
		expect(typed.shown).toEqual([2, 10, 3, 0]);
		expect([typed.caretLine, typed.caretCol]).toEqual([2, 3]);
		// A typed break space leaves the caret at the end of its line.
		expect(agent.typedLines(spans, 3)).toMatchObject({ caretLine: 0, caretCol: 2 });
		expect(agent.typedLines(spans, 0)).toMatchObject({ caretLine: 0, caretCol: 0 });
	});
});

describe("gallery gear train", () => {
	const mod = (v: number, m: number) => ((v % m) + m) % m;
	const deg = (rad: number) => (rad * 180) / Math.PI;

	it("meshes: centre distances, speed ratios and tooth phases", () => {
		const train = gears.gearTrain({ x: 300, y: 432, phase: 4 }, gears.TRAIN, gears.MODULE);
		expect(train).toHaveLength(gears.TRAIN.length);
		expect(train[0].ratio).toBe(1);
		gears.TRAIN.forEach((spec, i) => {
			const g = train[i];
			expect(g.r).toBeCloseTo((gears.MODULE * spec.teeth) / 2);
			if (spec.from === undefined) return;
			const a = train[spec.from];
			// Pitch circles touch.
			expect(Math.hypot(g.cx - a.cx, g.cy - a.cy)).toBeCloseTo(a.r + g.r, 6);
			// Meshing gears turn the other way, at the inverse tooth ratio.
			expect(g.ratio).toBeCloseTo((-a.ratio * a.teeth) / g.teeth, 9);
			// On the line of centres, a tooth of one faces a gap of the other: in tooth pitches,
			// the two offsets from tooth 0 sum to a half.
			const theta = deg(Math.atan2(g.cy - a.cy, g.cx - a.cx));
			const uA = ((theta - a.phase) * a.teeth) / 360;
			const uB = ((theta + 180 - g.phase) * g.teeth) / 360;
			expect(mod(uA + uB, 1)).toBeCloseTo(0.5, 6);
			// ...and still do once the train has turned (any drive angle).
			const turn = 47.3;
			const uA2 = ((theta - (a.phase + turn * a.ratio)) * a.teeth) / 360;
			const uB2 = ((theta + 180 - (g.phase + turn * g.ratio)) * g.teeth) / 360;
			expect(mod(uA2 + uB2, 1)).toBeCloseTo(0.5, 6);
		});
	});

	it("never overlaps gears that do not mesh", () => {
		const train = gears.gearTrain({ x: 300, y: 432, phase: 4 }, gears.TRAIN, gears.MODULE);
		const tip = (g: Gear) => g.r + gears.MODULE;
		for (let i = 0; i < train.length; i++) {
			for (let j = i + 1; j < train.length; j++) {
				const meshing = gears.TRAIN[j].from === i || gears.TRAIN[i].from === j;
				if (meshing) continue;
				const d = Math.hypot(train[i].cx - train[j].cx, train[i].cy - train[j].cy);
				expect(d, `${i}-${j}`).toBeGreaterThan(tip(train[i]) + tip(train[j]));
			}
		}
	});
});

describe("v2 sources", () => {
	// Every source file of every v2 segment (a segment may split into modules), and the
	// transition written for demo_v2.
	const segments = readdirSync(join(DEMO, "segments"))
		.filter((d) => d.startsWith("v2-"))
		.flatMap((d) =>
			readdirSync(join(DEMO, "segments", d))
				.filter((f) => f.endsWith(".ts"))
				.map((f) => join(DEMO, "segments", d, f)),
		)
		.concat(join(DEMO, "transitions/me-split.ts"));
	const kit = readdirSync(KIT)
		.filter((f) => f.endsWith(".ts") || f.endsWith(".css"))
		.map((f) => join(KIT, f));
	const files = [...kit, ...segments];
	const read = (path: string) => readFileSync(path, "utf-8");

	it("covers the kit and the segments", () => {
		expect(segments.length).toBeGreaterThanOrEqual(9);
		expect(kit.map((f) => f.split("/").pop())).toEqual(
			expect.arrayContaining(["motion.ts", "hud.ts", "stage.ts", "terminal.ts", "v2.css"]),
		);
	});

	it("respect the legibility floor (no font-size below 22px)", () => {
		for (const file of files) {
			for (const m of read(file).matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
				expect(Number(m[1]), `${file}: ${m[0]}`).toBeGreaterThanOrEqual(22);
			}
		}
	});

	it("use no Math.random and no SMIL", () => {
		for (const file of files) {
			const source = read(file);
			expect(source, file).not.toMatch(/Math\.random\s*\(/);
			expect(source, file).not.toMatch(/<animate|<set\b/);
		}
	});

	it("import only videowright, relative paths and the demo's declared libraries", () => {
		const pkg = JSON.parse(read(join(DEMO, "package.json"))) as {
			dependencies: Record<string, string>;
		};
		const libraries = Object.keys(pkg.dependencies).filter((d) => d !== "videowright");
		expect(libraries).toEqual(expect.arrayContaining(["echarts", "three", "lottie-web"]));
		for (const file of files.filter((f) => f.endsWith(".ts"))) {
			for (const m of read(file).matchAll(/^import[^"]*"([^"]+)";/gm)) {
				const spec = m[1];
				const ok =
					spec === "videowright" ||
					spec.startsWith(".") ||
					libraries.some((lib) => spec === lib || spec.startsWith(`${lib}/`));
				expect(ok, `${file}: ${spec}`).toBe(true);
			}
		}
	});

	it("draw the logo from the bundled mark, which is the spec's mark", () => {
		expect(read(join(KIT, "logo.ts"))).toContain('from "./assets/videowright-mark.svg?raw"');
		const asset = read(join(KIT, "assets/videowright-mark.svg"));
		const spec = read(resolve(DEMO, "../../specs/projects/demo_v2/assets/videowright-mark.svg"));
		expect(asset).toBe(spec);
		// MARK_BOUNDS is the strokes' extent plus their round caps.
		const lines = [
			...asset.matchAll(
				/<line[^>]*x1="(\d+)" y1="(\d+)" x2="(\d+)" y2="(\d+)"[^>]*stroke-width="(\d+)"/g,
			),
		];
		expect(lines).toHaveLength(3);
		const r = Number(lines[0][5]) / 2;
		const xs = lines.flatMap((l) => [Number(l[1]), Number(l[3])]);
		const ys = lines.flatMap((l) => [Number(l[2]), Number(l[4])]);
		const bounds = `{ x: ${Math.min(...xs) - r}, y: ${Math.min(...ys) - r}, w: ${Math.max(...xs) - Math.min(...xs) + 2 * r}, h: ${Math.max(...ys) - Math.min(...ys) + 2 * r} }`;
		expect(read(join(KIT, "logo.ts"))).toContain(`MARK_BOUNDS = ${bounds}`);
	});

	it("bundle the wordmark face and the product UI's face with their licences", () => {
		const css = read(join(KIT, "v2.css"));
		expect(css).toContain('url("./assets/fonts/outfit-semibold.woff2")');
		expect(css).toContain('url("./assets/fonts/inter-variable.woff2")');
		expect(css.match(/font-display: block/g)?.length).toBe(2);
		expect(read(join(KIT, "assets/fonts/OFL.txt"))).toContain("SIL Open Font License");
		expect(read(join(KIT, "assets/fonts/INTER-OFL.txt"))).toContain("SIL Open Font License");
		// fontsReady() awaits both, so no frame shows a fallback face.
		expect(read(join(KIT, "fonts.ts"))).toContain('"Inter"');
	});
});
