import "./v2.css";
import { type Camera, cameraTransform, svg } from "./motion.js";

// A full-bleed terminal window running a Claude Code session, at legible 1x scale: JetBrains
// Mono 32px on a fixed 46px row grid, so every line's box is known and the camera can frame
// it. Rows are absolutely positioned and rewritten in place, the way a TUI redraws.

export const TERM = {
	/** Top of row 0, below the title bar. */
	top: 84,
	row: 46,
	/** Left edge of column 0. */
	left: 56,
	/** JetBrains Mono advances 0.6em. */
	col: 19.2,
} as const;

export const rowY = (r: number) => TERM.top + r * TERM.row;
export const colX = (c: number) => TERM.left + c * TERM.col;

export interface TerminalOptions {
	title: string;
	/** Shown in the session header. */
	version: string;
	model: string;
	cwd: string;
}

export interface TerminalInput {
	box: HTMLElement;
	text: HTMLElement;
	after: HTMLElement;
	caret: HTMLElement;
	/** Moves the box so its text sits on row `r` (the box spans r - 1 to r + 1). */
	setRow(r: number): void;
	/** x of the caret's left edge (1x px) after `chars` characters of text. */
	caretX(chars: number): number;
}

export interface Terminal {
	root: HTMLElement;
	/** The camera moves this. */
	world: HTMLElement;
	input: TerminalInput;
	/** Sets row `r` to `html` (creating it), indented by `indent` columns. */
	line(r: number, html: string, indent?: number): HTMLElement;
	clear(r: number): void;
	setCamera(cam: Camera): void;
}

// The Claude Code mascot, from its block-character art, as half-cell pixels (two per column,
// two per row). Drawn in SVG so the rows touch, the way they do in a terminal.
const MASCOT = [
	"   ############   ",
	"   ## ###### ##   ",
	" ################ ",
	"   ############   ",
	"    # #    # #    ",
];

/** x where the text inside the input box starts (after "│ > "). */
const INPUT_TEXT_X = 110;
/** The input box's prompt chevron x. */
const PROMPT_X = 72;

export function createTerminal(host: HTMLElement, opts: TerminalOptions): Terminal {
	host.innerHTML = `
		<div class="v2-term">
			<div class="v2-term-world">
				<div class="v2-term-bar">
					<span class="v2-term-dot" style="left:24px"></span>
					<span class="v2-term-dot" style="left:48px"></span>
					<span class="v2-term-dot" style="left:72px"></span>
					<div class="v2-term-title">${opts.title}</div>
				</div>
				<div data-ref="rows"></div>
				<div class="v2-term-input">
					<span class="v2-claude" style="position:absolute; left:${PROMPT_X - 42}px; top:21px">&gt;</span>
					<span style="position:absolute; left:${INPUT_TEXT_X - 42}px; top:21px; white-space:pre"><span data-ref="input"></span><span data-ref="after"></span><span class="v2-caret" data-ref="caret"></span></span>
				</div>
			</div>
		</div>`;
	const q = (s: string) => host.querySelector(s) as HTMLElement;
	const root = q(".v2-term");
	const world = q(".v2-term-world");
	const rows = q('[data-ref="rows"]');
	const box = q(".v2-term-input");
	const byRow = new Map<number, HTMLElement>();

	const line = (r: number, html: string, indent = 0) => {
		let el = byRow.get(r);
		if (!el) {
			el = document.createElement("div");
			el.className = "v2-term-row";
			el.style.top = `${rowY(r)}px`;
			rows.appendChild(el);
			byRow.set(r, el);
		}
		el.style.left = `${colX(indent)}px`;
		el.innerHTML = html;
		return el;
	};

	// Header: the mascot (columns 0-8, rows 0-2) and the session facts beside it.
	const art = svg(world, "svg", {
		width: 9 * TERM.col,
		height: 100,
		viewBox: "0 0 18 5",
		preserveAspectRatio: "none",
		style: `position:absolute; left:${TERM.left}px; top:${rowY(0) + 19}px; shape-rendering:crispEdges`,
	});
	MASCOT.forEach((pixels, y) => {
		for (let x = 0; x < pixels.length; x++) {
			if (pixels[x] === "#") {
				svg(art, "rect", { x, y, width: 1.04, height: 1.04, fill: "var(--claude)" });
			}
		}
	});
	line(
		0,
		`<span class="v2-bold">Claude Code</span> <span class="v2-dim">${opts.version}</span>`,
		11,
	);
	line(1, `<span class="v2-dim">${opts.model}</span>`, 11);
	line(2, `<span class="v2-dim">${opts.cwd}</span>`, 11);

	const input: TerminalInput = {
		box,
		text: q('[data-ref="input"]'),
		after: q('[data-ref="after"]'),
		caret: q('[data-ref="caret"]'),
		setRow: (r) => {
			box.style.top = `${rowY(r - 1) + 23}px`;
		},
		caretX: (chars) => INPUT_TEXT_X + chars * TERM.col,
	};

	return {
		root,
		world,
		input,
		line,
		clear: (r) => {
			byRow.get(r)?.remove();
			byRow.delete(r);
		},
		setCamera: (cam) => {
			world.style.transform = cameraTransform(cam);
		},
	};
}

// ── Claude Code TUI fragments (HTML for one row) ───────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const tui = {
	/** A Claude message: an orange bullet, then text. */
	say: (html: string) => `<span class="v2-claude">⏺</span> ${html}`,
	/** A tool call: bold tool name, dim argument. */
	tool: (name: string, arg: string) =>
		`<span class="v2-claude">⏺</span> <span class="v2-bold">${name}</span><span class="v2-dim">(${esc(arg)})</span>`,
	/** A tool result under its call. */
	result: (text: string) =>
		`  <span class="v2-faint">⎿</span>  <span class="v2-dim">${esc(text)}</span>`,
	/** The paste chip. */
	chip: (text: string) => `<span class="v2-chip">${esc(text)}</span>`,
	/** The user's prompt, echoed in the transcript. */
	echo: (text: string, chip?: string) =>
		`<span class="v2-dim">&gt;</span> <span class="v2-dim">${esc(text)}</span>${chip ? ` ${tui.chip(chip)}` : ""}`,
	/** The working line: the orange status pip, the verb, and dim counters. */
	spinner: (glyph: string, verb: string, meta: string) =>
		`<span class="v2-claude">${glyph}</span> ${verb} <span class="v2-dim">(${esc(meta)})</span>`,
	code: (text: string) => `<span class="v2-code">${esc(text)}</span>`,
};

// Claude Code's spinner glyphs, ping-ponged.
const SPIN = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
/** The spinner glyph at time `t` (ms since it started), one step per 110ms. */
export const spinnerGlyph = (t: number) => SPIN[Math.floor(Math.max(0, t) / 110) % SPIN.length];
