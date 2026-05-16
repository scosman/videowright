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
	flex-wrap: nowrap;
	gap: 6px 16px;
	align-items: center;
	height: 100%;
	max-width: 100vw;
	max-height: 80px;
	overflow: hidden;
}
.vw-hud-info {
	position: relative;
	display: flex;
	flex-direction: column;
	flex: 0 0 auto;
	max-width: 30vw;
	min-width: 0;
	gap: 2px;
}
.vw-hud-row {
	display: flex;
	align-items: center;
	gap: 8px;
}
.vw-hud-item {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	flex-shrink: 0;
}
.vw-hud-label { opacity: 0.6; margin-right: 4px; }
.vw-hud-separator { opacity: 0.5; }
.vw-hud-vo {
	opacity: 0.8;
	font-style: italic;
	min-width: 0;
	flex: 1 1 0;
	overflow-y: auto;
	overflow-x: hidden;
	max-height: 80px;
}
.vw-hud-keys {
	opacity: 0.4;
	font-size: 11px;
	margin-left: auto;
	flex: 0 0 auto;
	display: grid;
	grid-template-columns: auto auto;
	grid-template-rows: repeat(3, auto);
	gap: 0 12px;
	max-height: 80px;
	overflow-y: auto;
}
.vw-hud-key-item { white-space: nowrap; }
.vw-hud-ended {
	font-size: 10px;
	text-transform: uppercase;
	opacity: 0.7;
	line-height: 1;
	position: absolute;
	top: -12px;
	left: 0;
}
/* Error display: horizontal layout for fixed-height HUD strip.
   Left accent + icon | two-line title+message (truncated) | reload button.
   Click the error text to log the full stack trace to the browser console,
   since the fixed 80px HUD height is too small for inline stack display. */
.vw-hud-error-overlay {
	position: absolute;
	inset: 0;
	background: rgba(50,10,10,0.95);
	border-left: 4px solid #e54;
	display: flex;
	flex-direction: row;
	align-items: center;
	pointer-events: auto;
	padding: 0 16px;
	gap: 12px;
	overflow: hidden;
}
.vw-hud-error-icon {
	font-size: 24px;
	line-height: 1;
	flex-shrink: 0;
	opacity: 0.9;
}
.vw-hud-error-text {
	flex: 1 1 0;
	min-width: 0;
	overflow: hidden;
	cursor: pointer;
}
.vw-hud-error-title {
	font-size: 14px;
	font-weight: 600;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin: 0;
}
.vw-hud-error-message {
	font-size: 13px;
	opacity: 0.8;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	margin: 2px 0 0;
}
.vw-hud-btn {
	background: rgba(255,255,255,0.2);
	border: 1px solid rgba(255,255,255,0.4);
	color: #fff;
	padding: 6px 14px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	white-space: nowrap;
	flex-shrink: 0;
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

const KEY_BINDINGS = [
	"→: next",
	"←: prev",
	"Space: play/pause",
	"R: restart",
	"H: HUD",
	"1-9: jump",
];

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

			if (!isVisible) return;

			const inner = document.createElement("div");
			inner.className = "vw-hud-inner";

			// Play/pause button (shown in dev mode, not render)
			if (state.mode !== "render" && playBtn) {
				playBtn.textContent = state.playbackMode === "playing" ? "⏸" : "▶";
				playBtn.title = state.playbackMode === "playing" ? "Pause" : "Play";
				inner.appendChild(playBtn);
			}

			// Info column: segment label + timing row
			const info = document.createElement("div");
			info.className = "vw-hud-info";

			// Ended indicator (absolutely positioned above segment line)
			if (state.ended) {
				const badge = document.createElement("div");
				badge.className = "vw-hud-ended";
				badge.textContent = "END OF TIMELINE";
				info.appendChild(badge);
			}

			// Row 0: segment label
			const row0 = document.createElement("div");
			row0.className = "vw-hud-row";
			const segItem = document.createElement("span");
			segItem.className = "vw-hud-item";
			const segLabel = document.createElement("span");
			segLabel.className = "vw-hud-label";
			segLabel.textContent = "segment:";
			segItem.appendChild(segLabel);
			segItem.appendChild(document.createTextNode(`${state.beat} ${state.segmentId}`));
			row0.appendChild(segItem);
			info.appendChild(row0);

			// Row 1: timing row
			const row1 = document.createElement("div");
			row1.className = "vw-hud-row";

			const segTimeItem = document.createElement("span");
			segTimeItem.className = "vw-hud-item";
			const segTimeLabel = document.createElement("span");
			segTimeLabel.className = "vw-hud-label";
			segTimeLabel.textContent = "seg time:";
			segTimeItem.appendChild(segTimeLabel);
			segTimeItem.appendChild(document.createTextNode(formatTime(state.segmentTime)));
			row1.appendChild(segTimeItem);

			const separator = document.createElement("span");
			separator.className = "vw-hud-separator";
			separator.textContent = "·";
			row1.appendChild(separator);

			const totalItem = document.createElement("span");
			totalItem.className = "vw-hud-item";
			const totalLabel = document.createElement("span");
			totalLabel.className = "vw-hud-label";
			totalLabel.textContent = "total:";
			totalItem.appendChild(totalLabel);
			totalItem.appendChild(document.createTextNode(formatTime(state.totalTime)));
			row1.appendChild(totalItem);

			info.appendChild(row1);
			inner.appendChild(info);

			// Voiceover (only when truthy)
			if (state.voiceover) {
				const vo = document.createElement("div");
				vo.className = "vw-hud-vo";
				vo.textContent = state.voiceover;
				inner.appendChild(vo);
			}

			// Keyboard shortcuts
			const keys = document.createElement("div");
			keys.className = "vw-hud-keys";
			for (const binding of KEY_BINDINGS) {
				const keyItem = document.createElement("span");
				keyItem.className = "vw-hud-key-item";
				keyItem.textContent = binding;
				keys.appendChild(keyItem);
			}
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

function renderError(error: { segmentId: string; message: string; stack?: string }): HTMLElement {
	const overlay = document.createElement("div");
	overlay.className = "vw-hud-error-overlay";

	// Error icon
	const icon = document.createElement("span");
	icon.className = "vw-hud-error-icon";
	icon.textContent = "⚠"; // warning sign
	overlay.appendChild(icon);

	// Two-line text block: title + message (both truncated with ellipsis)
	const textBlock = document.createElement("div");
	textBlock.className = "vw-hud-error-text";

	const title = document.createElement("div");
	title.className = "vw-hud-error-title";
	title.textContent = `Segment error: ${error.segmentId}`;
	title.title = `Segment error: ${error.segmentId}`;
	textBlock.appendChild(title);

	const msg = document.createElement("div");
	msg.className = "vw-hud-error-message";
	msg.textContent = error.message;
	msg.title = error.stack ? `${error.message}\n\n${error.stack}` : error.message;
	textBlock.appendChild(msg);

	textBlock.addEventListener("click", () => {
		if (error.stack) {
			console.error(
				`[Videowright] Segment error: ${error.segmentId}\n${error.message}\n\n${error.stack}`,
			);
		} else {
			console.error(`[Videowright] Segment error: ${error.segmentId}\n${error.message}`);
		}
	});

	overlay.appendChild(textBlock);

	// Reload button
	const reloadBtn = document.createElement("button");
	reloadBtn.className = "vw-hud-btn";
	reloadBtn.textContent = "Reload";
	reloadBtn.addEventListener("click", () => location.reload());
	overlay.appendChild(reloadBtn);

	return overlay;
}
