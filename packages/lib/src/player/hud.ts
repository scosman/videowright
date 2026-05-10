/**
 * Dev-mode HUD overlay.
 * Shows segment info, timing, voiceover, mode, keyboard reference, errors.
 */

export interface HudState {
	segmentId: string;
	beat: number;
	segmentTime: number;
	totalTime: number;
	voiceover?: string;
	mode: "interactive" | "render";
	ended: boolean;
	error?: { segmentId: string; message: string; stack?: string };
	playbackMode?: "idle" | "playing";
	recordMode?: boolean;
}

export interface HudOptions {
	onPlayToggle?: () => void;
}

export interface Hud {
	el: HTMLDivElement;
	update(state: HudState): void;
	show(): void;
	hide(): void;
	toggle(): void;
	destroy(): void;
	readonly visible: boolean;
}

const HUD_STYLES = `
.vw-hud {
	position: absolute;
	inset: 0;
	pointer-events: none;
	font-family: system-ui, -apple-system, sans-serif;
	font-size: 13px;
	color: #fff;
	z-index: 9999;
}
.vw-hud-inner {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: rgba(0,0,0,0.75);
	padding: 10px 14px;
	pointer-events: auto;
	display: flex;
	flex-wrap: wrap;
	gap: 6px 16px;
	align-items: baseline;
}
.vw-hud-item { white-space: nowrap; }
.vw-hud-label { opacity: 0.6; margin-right: 4px; }
.vw-hud-vo {
	flex-basis: 100%;
	opacity: 0.8;
	font-style: italic;
	white-space: normal;
	max-height: 3.6em;
	overflow: hidden;
}
.vw-hud-keys {
	flex-basis: 100%;
	opacity: 0.4;
	font-size: 11px;
}
.vw-hud-ended {
	position: absolute;
	top: 14px;
	right: 14px;
	background: rgba(0,0,0,0.75);
	padding: 6px 12px;
	border-radius: 4px;
	pointer-events: auto;
}
.vw-hud-error-overlay {
	position: absolute;
	inset: 0;
	background: rgba(180,30,30,0.92);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
	padding: 24px;
	text-align: center;
}
.vw-hud-error-overlay h2 { margin: 0 0 8px; font-size: 18px; }
.vw-hud-error-overlay p { margin: 0 0 12px; opacity: 0.9; }
.vw-hud-error-stack {
	max-width: 80%;
	max-height: 200px;
	overflow: auto;
	background: rgba(0,0,0,0.4);
	padding: 10px;
	border-radius: 4px;
	font-size: 11px;
	font-family: monospace;
	text-align: left;
	white-space: pre-wrap;
	word-break: break-all;
	margin-bottom: 12px;
}
.vw-hud-btn {
	background: rgba(255,255,255,0.2);
	border: 1px solid rgba(255,255,255,0.4);
	color: #fff;
	padding: 6px 14px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	margin: 4px;
}
.vw-hud-btn:hover { background: rgba(255,255,255,0.3); }
.vw-hud-play {
	background: rgba(255,255,255,0.15);
	border: 1px solid rgba(255,255,255,0.35);
	color: #fff;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	cursor: pointer;
	font-size: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: auto;
	padding: 0;
	line-height: 1;
	flex-shrink: 0;
}
.vw-hud-play:hover { background: rgba(255,255,255,0.3); }
`;

function formatTime(ms: number): string {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${sec.toString().padStart(2, "0")}`;
}

let hudStyleRefCount = 0;

function acquireHudStyles(): void {
	hudStyleRefCount++;
	if (hudStyleRefCount === 1) {
		const style = document.createElement("style");
		style.setAttribute("data-vw-hud", "");
		style.textContent = HUD_STYLES;
		document.head.appendChild(style);
	}
}

function releaseHudStyles(): void {
	hudStyleRefCount--;
	if (hudStyleRefCount <= 0) {
		hudStyleRefCount = 0;
		const style = document.querySelector("style[data-vw-hud]");
		if (style) style.remove();
	}
}

export function createHud(options?: HudOptions): Hud {
	const el = document.createElement("div");
	el.className = "vw-hud";

	acquireHudStyles();

	let isVisible = true;

	// Persistent play button -- created once, updated on each render.
	// Avoids recreating and re-attaching listeners on every update() call.
	let playBtn: HTMLButtonElement | null = null;
	if (options?.onPlayToggle) {
		playBtn = document.createElement("button");
		playBtn.className = "vw-hud-play";
		playBtn.textContent = "▶";
		playBtn.title = "Play";
		const handler = options.onPlayToggle;
		playBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			handler();
		});
	}

	const hud: Hud = {
		el,
		get visible() {
			return isVisible;
		},
		update(state: HudState) {
			el.innerHTML = "";

			if (state.error) {
				el.appendChild(renderError(state.error));
				return;
			}

			if (state.ended) {
				const badge = document.createElement("div");
				badge.className = "vw-hud-ended";
				badge.textContent = "End of timeline";
				el.appendChild(badge);
			}

			if (!isVisible) return;

			const inner = document.createElement("div");
			inner.className = "vw-hud-inner";

			// Play/pause button (shown in dev and record modes, not render)
			if (state.mode !== "render" && playBtn) {
				playBtn.textContent = state.playbackMode === "playing" ? "⏸" : "▶";
				playBtn.title = state.playbackMode === "playing" ? "Pause" : "Play";
				inner.appendChild(playBtn);
			}

			// In record mode, show only play button and end-of-timeline badge
			if (state.recordMode) {
				el.appendChild(inner);
				return;
			}

			addItem(inner, "segment", state.segmentId);
			addItem(inner, "beat", String(state.beat));
			addItem(inner, "seg time", formatTime(state.segmentTime));
			addItem(inner, "total", formatTime(state.totalTime));
			addItem(inner, "mode", state.mode);

			if (state.voiceover) {
				const vo = document.createElement("div");
				vo.className = "vw-hud-vo";
				vo.textContent = state.voiceover;
				inner.appendChild(vo);
			}

			const keys = document.createElement("div");
			keys.className = "vw-hud-keys";
			keys.textContent = "→/Space: next | ←: prev | R: restart | H: HUD | 1-9: jump";
			inner.appendChild(keys);

			el.appendChild(inner);
		},
		show() {
			isVisible = true;
			el.style.display = "";
		},
		hide() {
			isVisible = false;
			el.style.display = "none";
		},
		toggle() {
			if (isVisible) hud.hide();
			else hud.show();
		},
		destroy() {
			releaseHudStyles();
		},
	};

	return hud;
}

function addItem(parent: HTMLElement, label: string, value: string): void {
	const span = document.createElement("span");
	span.className = "vw-hud-item";

	const lbl = document.createElement("span");
	lbl.className = "vw-hud-label";
	lbl.textContent = `${label}:`;

	span.appendChild(lbl);
	span.appendChild(document.createTextNode(value));
	parent.appendChild(span);
}

function renderError(error: { segmentId: string; message: string; stack?: string }): HTMLElement {
	const overlay = document.createElement("div");
	overlay.className = "vw-hud-error-overlay";

	const h2 = document.createElement("h2");
	h2.textContent = `Segment error: ${error.segmentId}`;
	overlay.appendChild(h2);

	const p = document.createElement("p");
	p.textContent = error.message;
	overlay.appendChild(p);

	if (error.stack) {
		const stackEl = document.createElement("div");
		stackEl.className = "vw-hud-error-stack";
		stackEl.textContent = error.stack;
		stackEl.style.display = "none";
		overlay.appendChild(stackEl);

		const toggleBtn = document.createElement("button");
		toggleBtn.className = "vw-hud-btn";
		toggleBtn.textContent = "Show stack trace";
		toggleBtn.addEventListener("click", () => {
			const visible = stackEl.style.display !== "none";
			stackEl.style.display = visible ? "none" : "block";
			toggleBtn.textContent = visible ? "Show stack trace" : "Hide stack trace";
		});
		overlay.appendChild(toggleBtn);
	}

	const reloadBtn = document.createElement("button");
	reloadBtn.className = "vw-hud-btn";
	reloadBtn.textContent = "Reload";
	reloadBtn.addEventListener("click", () => location.reload());
	overlay.appendChild(reloadBtn);

	return overlay;
}
