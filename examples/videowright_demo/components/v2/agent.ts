import "./v2.css";
import { drawMascot } from "./terminal.js";

// A windowed Claude Code session, for split screens: the cold open's TUI (same palette, same
// tui fragments from terminal.ts) in a narrower window, JetBrains Mono 30px on a fixed 42px row
// grid, so every line's box is known. Text that is wider than the window wraps at word
// boundaries, the way Claude Code's input box and transcript do.

export const PANE = {
	/** Title bar height. */
	bar: 48,
	/** Top of row 0, from the window's top. */
	top: 70,
	row: 42,
	/** Left edge of column 0, from the window's left. */
	left: 30,
	/** JetBrains Mono advances 0.6em (30px type). */
	col: 18,
} as const;

/** One wrapped line: its text and where it starts in the source text. */
export interface WrappedLine {
	text: string;
	start: number;
}

/**
 * Word-wraps `text` to lines of at most `cols` characters; a longer word is split. Each line
 * keeps its offset in `text`, so typing through it knows which characters are on screen: a
 * break at a space consumes the space, a break inside a split word consumes nothing.
 */
export function wrapSpans(text: string, cols: number): WrappedLine[] {
	const lines: WrappedLine[] = [];
	let line: WrappedLine | null = null;
	let at = 0;
	for (const word of text.split(" ")) {
		let rest = word;
		let restAt = at;
		while (rest.length > cols) {
			if (line?.text) lines.push(line);
			line = null;
			lines.push({ text: rest.slice(0, cols), start: restAt });
			rest = rest.slice(cols);
			restAt += cols;
		}
		if (!line?.text) line = { text: rest, start: restAt };
		else if (line.text.length + 1 + rest.length <= cols) line.text += ` ${rest}`;
		else {
			lines.push(line);
			line = { text: rest, start: restAt };
		}
		at += word.length + 1;
	}
	lines.push(line ?? { text: "", start: text.length });
	return lines;
}

/** Word-wraps `text` to lines of at most `cols` characters; a longer word is split. */
export function wrapColumns(text: string, cols: number): string[] {
	return wrapSpans(text, cols).map((line) => line.text);
}

/**
 * The first `chars` characters of `text` as wrapped `lines`: how much of each line shows, and
 * where the caret sits (after the last typed character; a typed break space leaves it at the
 * end of its line).
 */
export function typedLines(lines: readonly WrappedLine[], chars: number) {
	const shown = lines.map((l) => Math.max(0, Math.min(l.text.length, chars - l.start)));
	let caretLine = 0;
	lines.forEach((l, i) => {
		if (l.start < chars) caretLine = i;
	});
	return { shown, caretLine, caretCol: shown[caretLine] };
}

export interface AgentPaneOptions {
	/** The window's box in its parent's px. */
	x: number;
	y: number;
	w: number;
	h: number;
	title: string;
	/** Shown beside the mascot. */
	cwd: string;
}

export interface AgentInput {
	box: HTMLElement;
	caret: HTMLElement;
	/** Characters per input line (after the "> " prompt). */
	cols: number;
	/** Shows the first `chars` characters of `text`, wrapped to the box, caret after the last. */
	show(text: string, chars: number): void;
	/** Moves the box so its first text line sits on row `r`. */
	setRow(r: number): void;
}

export interface AgentPane {
	root: HTMLElement;
	/** Characters per transcript line. */
	cols: number;
	rowY(r: number): number;
	/** Sets row `r` to `html` (creating it), indented by `indent` columns. */
	line(r: number, html: string, indent?: number): HTMLElement;
	clear(r: number): void;
	input: AgentInput;
}

export function createAgentPane(host: HTMLElement, opts: AgentPaneOptions): AgentPane {
	const root = document.createElement("div");
	root.className = "v2-pane";
	root.style.cssText = `left:${opts.x}px; top:${opts.y}px; width:${opts.w}px; height:${opts.h}px`;
	root.innerHTML = `
		<div class="v2-pane-bar">
			<span class="v2-term-dot" style="left:22px; top:17px"></span>
			<span class="v2-term-dot" style="left:44px; top:17px"></span>
			<span class="v2-term-dot" style="left:66px; top:17px"></span>
			<div class="v2-term-title" style="line-height:48px"></div>
		</div>
		<div data-ref="rows"></div>
		<div class="v2-pane-input">
			<span class="v2-claude" style="position:absolute; left:20px; top:8px">&gt;</span>
			<div data-ref="lines" style="position:absolute; left:56px; top:8px"></div>
		</div>`;
	host.appendChild(root);
	(root.querySelector(".v2-term-title") as HTMLElement).textContent = opts.title;
	const rows = root.querySelector('[data-ref="rows"]') as HTMLElement;
	const box = root.querySelector(".v2-pane-input") as HTMLElement;
	const lineHost = root.querySelector('[data-ref="lines"]') as HTMLElement;
	const byRow = new Map<number, HTMLElement>();
	const rowY = (r: number) => PANE.top + r * PANE.row;
	const cols = Math.floor((opts.w - 2 * PANE.left) / PANE.col);

	const line = (r: number, html: string, indent = 0) => {
		let el = byRow.get(r);
		if (!el) {
			el = document.createElement("div");
			el.className = "v2-pane-row";
			el.style.top = `${rowY(r)}px`;
			rows.appendChild(el);
			byRow.set(r, el);
		}
		el.style.left = `${PANE.left + indent * PANE.col}px`;
		el.innerHTML = html;
		return el;
	};

	// Header: the mascot over two rows, the product and the folder beside it.
	drawMascot(root, PANE.left, rowY(0) + 8, 7 * PANE.col, 74);
	line(0, '<span class="v2-bold">Claude Code</span>', 8);
	line(1, `<span class="v2-dim">${opts.cwd}</span>`, 8);

	// The input box spans the window less a 14px margin; text starts after "> ".
	box.style.left = "14px";
	box.style.width = `${opts.w - 28}px`;
	const inputCols = Math.floor((opts.w - 28 - 56 - 20) / PANE.col);
	const caret = document.createElement("span");
	caret.className = "v2-caret";
	caret.style.cssText = "position:absolute; width:17px; height:36px";
	let shownText = "";
	let shownChars = -1;
	let spans: WrappedLine[] = wrapSpans("", inputCols);
	const input: AgentInput = {
		box,
		caret,
		cols: inputCols,
		show: (text, chars) => {
			if (text === shownText && chars === shownChars) return;
			if (text !== shownText) spans = wrapSpans(text, inputCols);
			shownText = text;
			shownChars = chars;
			const { shown, caretLine, caretCol } = typedLines(spans, chars);
			const html = spans.map(
				(line, i) =>
					`<div style="position:absolute; top:${i * PANE.row}px; white-space:pre">${esc(line.text.slice(0, shown[i]))}</div>`,
			);
			// The box grows with the lines the text will need, as Claude Code's input does.
			const visibleLines = caretLine + 1;
			lineHost.innerHTML = html.slice(0, visibleLines).join("");
			box.style.height = `${visibleLines * PANE.row + 20}px`;
			caret.style.left = `${caretCol * PANE.col}px`;
			caret.style.top = `${caretLine * PANE.row + 4}px`;
			lineHost.appendChild(caret);
		},
		setRow: (r) => {
			box.style.top = `${rowY(r) - 10}px`;
		},
	};
	input.show("", 0);

	return {
		root,
		cols,
		rowY,
		line,
		clear: (r) => {
			byRow.get(r)?.remove();
			byRow.delete(r);
		},
		input,
	};
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
