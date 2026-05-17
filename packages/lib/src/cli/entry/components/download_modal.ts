/**
 * Download modal: two-column layout offering "Export Video" (CLI command)
 * and "Screen Record" (instructions). Accessible from both homepage card
 * and video view top bar.
 */

import { renderCopyButton } from "./copy_button.js";
import { iconX } from "./icons.js";

export interface DownloadModalProps {
	slug: string;
	title: string;
	onClose: () => void;
	/** When true, the player is visible and screen-record tips apply. */
	hasPlayer?: boolean;
}

/**
 * Mount the download modal onto document.body.
 * Returns a cleanup function that removes it.
 */
export function renderDownloadModal(props: DownloadModalProps): () => void {
	// Dismiss any existing modal before opening a new one
	const existing = document.querySelector(".vw-modal-backdrop");
	if (existing) {
		existing.remove();
	}

	const { slug, title, onClose, hasPlayer = false } = props;

	// Backdrop
	const backdrop = document.createElement("div");
	backdrop.className = "vw-modal-backdrop";
	backdrop.setAttribute("role", "presentation");

	// Modal dialog
	const dialog = document.createElement("div");
	dialog.className = "vw-modal";
	dialog.setAttribute("role", "dialog");
	dialog.setAttribute("aria-modal", "true");
	dialog.setAttribute("aria-labelledby", "vw-modal-title");

	// Header
	const header = document.createElement("div");
	header.className = "vw-modal__header";

	const headerText = document.createElement("div");
	headerText.className = "vw-modal__header-text";

	const headerTitle = document.createElement("h2");
	headerTitle.className = "vw-modal__title";
	headerTitle.id = "vw-modal-title";
	headerTitle.textContent = `Export ${title}`;
	headerText.appendChild(headerTitle);

	const headerSlug = document.createElement("div");
	headerSlug.className = "vw-modal__slug";
	headerSlug.textContent = slug;
	headerText.appendChild(headerSlug);

	header.appendChild(headerText);

	const closeBtn = document.createElement("button");
	closeBtn.className = "vw-modal__close";
	closeBtn.type = "button";
	closeBtn.setAttribute("aria-label", "Close");
	closeBtn.innerHTML = iconX();
	closeBtn.addEventListener("click", dismiss);
	header.appendChild(closeBtn);

	dialog.appendChild(header);

	// Columns container
	const columns = document.createElement("div");
	columns.className = "vw-modal__columns";

	// --- Export Video column ---
	const exportCol = document.createElement("div");
	exportCol.className = "vw-modal__column";

	const exportLabel = document.createElement("div");
	exportLabel.className = "vw-modal__column-label";

	const exportLabelText = document.createElement("span");
	exportLabelText.textContent = "EXPORT VIDEO";
	exportLabel.appendChild(exportLabelText);

	const badge = document.createElement("span");
	badge.className = "vw-modal__badge";
	badge.textContent = "Recommended";
	exportLabel.appendChild(badge);

	exportCol.appendChild(exportLabel);

	const exportDesc = document.createElement("p");
	exportDesc.className = "vw-modal__desc";
	exportDesc.textContent = "Pixel-perfect MP4 export. Best quality.";
	exportCol.appendChild(exportDesc);

	// CLI command code block
	const cliCommand = `npx videowright render ${slug}`;
	const codeBlock = document.createElement("div");
	codeBlock.className = "vw-modal__code";

	const code = document.createElement("code");
	code.textContent = cliCommand;
	codeBlock.appendChild(code);

	const copyBtn = renderCopyButton(cliCommand);
	codeBlock.appendChild(copyBtn);

	exportCol.appendChild(codeBlock);

	const exportNote = document.createElement("p");
	exportNote.className = "vw-modal__note";
	exportNote.textContent = "Export is CLI-only — runs ffmpeg + Playwright on your machine.";
	exportCol.appendChild(exportNote);

	columns.appendChild(exportCol);

	// --- Screen Record column ---
	const recordCol = document.createElement("div");
	recordCol.className = "vw-modal__column";

	const recordLabel = document.createElement("div");
	recordLabel.className = "vw-modal__column-label";
	recordLabel.textContent = "SCREEN RECORD";
	recordCol.appendChild(recordLabel);

	const recordDesc = document.createElement("p");
	recordDesc.className = "vw-modal__desc";
	recordDesc.textContent = hasPlayer
		? "Capture in a live browser with your screen recorder. Manual pace, great for live VO."
		: "Open the video player to use your screen recorder.";
	recordCol.appendChild(recordDesc);

	if (hasPlayer) {
		const tips = document.createElement("ul");
		tips.className = "vw-modal__tips";

		const tipItems = ["Press H to hide HUD", "→ next | ← prev", "Space to play/pause"];
		for (const tipText of tipItems) {
			const li = document.createElement("li");
			li.textContent = tipText;
			tips.appendChild(li);
		}

		recordCol.appendChild(tips);
	} else {
		const openPlayerBtn = document.createElement("a");
		openPlayerBtn.className = "vw-modal__open-player";
		openPlayerBtn.href = `/video/${slug}`;
		openPlayerBtn.textContent = "Open Player";
		recordCol.appendChild(openPlayerBtn);
	}
	columns.appendChild(recordCol);

	dialog.appendChild(columns);
	backdrop.appendChild(dialog);

	// Event handlers
	backdrop.addEventListener("click", (e) => {
		if (e.target === backdrop) dismiss();
	});

	function getFocusableElements(): HTMLElement[] {
		const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
		return Array.from(dialog.querySelectorAll<HTMLElement>(selectors)).filter(
			(el) => !el.hasAttribute("disabled"),
		);
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (e.key === "Escape") {
			e.preventDefault();
			dismiss();
			return;
		}

		// Focus trap: cycle Tab among focusable elements inside the dialog
		if (e.key === "Tab") {
			const focusable = getFocusableElements();
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	}

	function dismiss(): void {
		document.removeEventListener("keydown", onKeyDown);
		backdrop.remove();
		onClose();
	}

	document.addEventListener("keydown", onKeyDown);
	document.body.appendChild(backdrop);

	// Focus the close button for keyboard accessibility
	closeBtn.focus();

	return dismiss;
}
