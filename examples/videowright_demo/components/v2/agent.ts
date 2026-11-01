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

/** Word-wraps `text` to lines of at most `cols` characters; a longer word is split. */
export function wrapColumns(text: string, cols: number): string[] {
	const lines: string[] = [];
	let line = "";
	for (const word of text.split(" ")) {
		let rest = word;
		while (rest.length > cols) {
			if (line) lines.push(line);
			line = "";
			lines.push(rest.slice(0, cols));
			rest = rest.slice(cols);
		}
		if (!line) line = rest;
		else if (line.length + 1 + rest.length <= cols) line += ` ${rest}`;
		else {
			lines.push(line);
			line = rest;
		}
	}
	lines.push(line);
	return lines;
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
	/** Shows the first `chars` characters of `lines` (wrapped text), caret after the last. */
	show(lines: readonly string[], chars: number): void;
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
	let shown = -1;
	let lineCount = 0;
	const input: AgentInput = {
		box,
		caret,
		cols: inputCols,
		show: (lines, chars) => {
			if (chars === shown && lines.length === lineCount) return;
			shown = chars;
			lineCount = lines.length;
			let left = chars;
			let caretLine = 0;
			let caretCol = 0;
			const html: string[] = [];
			lines.forEach((text, i) => {
				// A wrapped line's trailing space is part of its length when typing through it.
				const take = Math.max(0, Math.min(text.length, left));
				const visible = text.slice(0, take);
				if (left > 0 || i === 0) {
					caretLine = i;
					caretCol = take;
				}
				left -= text.length + 1;
				html.push(
					`<div style="position:absolute; top:${i * PANE.row}px; white-space:pre">${esc(visible)}</div>`,
				);
			});
			// The box grows with the lines the text will need, as Claude Code's input does.
			const visibleLines = Math.max(1, caretLine + 1);
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
	input.show([""], 0);

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
