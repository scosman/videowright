/**
 * Copy-to-clipboard icon button.
 * Swaps to a check icon for 1.5s after a successful copy.
 */

import { iconCheck, iconCopy } from "./icons.js";

export function renderCopyButton(text: string): HTMLButtonElement {
	const btn = document.createElement("button");
	btn.className = "vw-copy-btn";
	btn.type = "button";
	btn.setAttribute("aria-label", "Copy to clipboard");
	btn.innerHTML = iconCopy();

	let timeout: ReturnType<typeof setTimeout> | null = null;

	btn.addEventListener("click", (e) => {
		e.stopPropagation();
		e.preventDefault();

		navigator.clipboard.writeText(text).then(
			() => {
				btn.innerHTML = iconCheck();
				btn.classList.add("vw-copy-btn--copied");
				btn.setAttribute("aria-label", "Copied");

				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(() => {
					btn.innerHTML = iconCopy();
					btn.classList.remove("vw-copy-btn--copied");
					btn.setAttribute("aria-label", "Copy to clipboard");
					timeout = null;
				}, 1500);
			},
			() => {
				// Clipboard API not available or denied -- silent fail for dev tool
			},
		);
	});

	return btn;
}
