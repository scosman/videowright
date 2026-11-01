// Typing that you can hear: visible keystrokes land on the typing SFX's own keystrokes.
// No imports, so it is unit-testable.

/**
 * Keystroke onsets in audio/originals/sfx/laptop_typing/audio.mp3 (seconds into the file),
 * measured from its click envelope (first difference, 5ms window, onset = rise through 18% of
 * peak, ≥45ms apart). Two bursts: 0.02–1.53s and 1.77–2.38s, a breath between them.
 */
export const LAPTOP_TYPING_ONSETS = [
	0.022, 0.094, 0.17, 0.245, 0.363, 0.425, 0.531, 0.653, 0.728, 0.802, 0.916, 0.992, 1.07, 1.155,
	1.231, 1.333, 1.429, 1.533, 1.772, 1.852, 1.938, 2.093, 2.179, 2.247, 2.377,
] as const;

/** One audio cue of the SFX: the slice [from, to] of the file placed at `at` (seconds). */
export interface TypingCue {
	at: number;
	from: number;
	to: number;
}

/** Track times (seconds) of every keystroke the cues play, in order. */
export function cueOnsets(
	cues: readonly TypingCue[],
	onsets: readonly number[] = LAPTOP_TYPING_ONSETS,
) {
	return cues.flatMap((cue) =>
		onsets.filter((o) => o >= cue.from && o <= cue.to).map((o) => cue.at + o - cue.from),
	);
}

/**
 * Times (ms) for typing `chars` characters across `onsets` (seconds): the first character
 * lands on the first keystroke and the last on the last, the rest spread by keystroke index,
 * so the text speeds up and slows down with the sound.
 */
export function spreadOver(chars: number, onsets: readonly number[]): number[] {
	if (chars <= 0 || onsets.length === 0) return [];
	if (chars === 1 || onsets.length === 1) return Array(chars).fill(onsets[0] * 1000);
	const last = onsets.length - 1;
	return Array.from({ length: chars }, (_, i) => {
		const pos = (i * last) / (chars - 1);
		const k = Math.min(Math.floor(pos), last - 1);
		const s = onsets[k] + (onsets[k + 1] - onsets[k]) * (pos - k);
		return Math.round(s * 1000);
	});
}

/**
 * Times (ms) for typing `text` between `start` and `end` (ms) on a seeded, human rhythm: each
 * key's gap jitters, and the key after a space or punctuation waits longer. The first
 * character lands on `start` and the last on `end` whatever the span, so a caller derives the
 * span from its advance window and a re-timed take re-paces the typing. No Math.random: the
 * same text and seed type the same in every render.
 */
export function typeSchedule(text: string, start: number, end: number, seed = 1): number[] {
	const n = text.length;
	if (n === 0) return [];
	if (n === 1) return [start];
	const gaps: number[] = [];
	for (let i = 1; i < n; i++) {
		const h = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
		const jitter = h - Math.floor(h);
		const beat = /[\s,.:/]/.test(text[i - 1]) ? 1.7 : 1;
		gaps.push((0.6 + 0.8 * jitter) * beat);
	}
	const total = gaps.reduce((a, b) => a + b, 0);
	let acc = 0;
	return [
		start,
		...gaps.map((g) => {
			acc += g;
			return start + ((end - start) * acc) / total;
		}),
	];
}

/** How many of the characters scheduled at `times` (ms) are typed by time `t` (ms). */
export function charsAt(times: readonly number[], t: number): number {
	let n = 0;
	while (n < times.length && times[n] <= t) n++;
	return n;
}

// ── The cold open's prompt ────────────────────────────────────────────────────────────
// audio/audio_plan.md places these same cues (a test keeps the two in step). The cold open is
// the first segment, so its clock is the track's clock (to within the render's ~20ms
// first-segment start offset: under a frame, and the sync is per keystroke burst, not per
// sample).

const ENTER_AT = 4.1;
/** After Enter (seconds): Claude's reply, the two tool calls, each result's lag, the pull-back. */
const AFTER_ENTER = { say: 0.3, tool1: 0.65, tool2: 1.0, resultLag: 0.13, pullBack: 1.3 } as const;

export const COLD_OPEN = {
	/** The prompt, split at the breath in the SFX. */
	prompt: ["I want to build a video,", " here's the script:"] as const,
	chip: "[Pasted 43 lines]",
	cues: {
		/** Burst 1 and the start of burst 2: the whole file. */
		typing: { at: 0.3, from: 0, to: 3.03 },
		/** The rest of burst 2, re-using the file's first run of keys. */
		typingTail: { at: 2.729, from: 0.33, to: 1.06 },
		/** One key each for the paste (cmd-V) and for Enter. */
		paste: { at: 3.605, from: 0.41, to: 0.52 },
		enter: { at: 4.087, from: 1.925, to: 2.06 },
	},
	/** When the paste chip lands and when Enter submits (seconds): on those two keys. */
	pasteAt: 3.62,
	enterAt: ENTER_AT,
	afterEnter: AFTER_ENTER,
	/**
	 * When the session has fully played out (seconds): every line in, the camera at rest. The
	 * first advance ("Video is ready") must not come earlier in a render, or the script jumps
	 * ahead to this state (the dev path for an early Next); a test checks the track.
	 */
	settledAt: ENTER_AT + Math.max(AFTER_ENTER.tool2 + AFTER_ENTER.resultLag, AFTER_ENTER.pullBack),
} as const;

/** Time (ms) each prompt character appears: burst 1 types the first clause, burst 2 the rest. */
export function coldOpenCharTimes(): number[] {
	const { typing, typingTail } = COLD_OPEN.cues;
	const onsets = cueOnsets([typing, typingTail]);
	const gap = onsets.findIndex((o, i) => i > 0 && o - onsets[i - 1] > 0.2);
	const [first, rest] = COLD_OPEN.prompt;
	return [
		...spreadOver(first.length, onsets.slice(0, gap)),
		...spreadOver(rest.length, onsets.slice(gap)),
	];
}
