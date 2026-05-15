/**
 * Cold-start empty state panel.
 * Shown on the homepage when no videos exist.
 */

import { renderCopyButton } from "./copy_button.js";

export function renderEmptyState(): HTMLElement {
	const panel = document.createElement("div");
	panel.className = "vw-empty";

	// Hero text
	const hero = document.createElement("h2");
	hero.className = "vw-empty__hero";
	hero.textContent = "No videos yet";
	panel.appendChild(hero);

	// Instruction
	const desc = document.createElement("p");
	desc.className = "vw-empty__desc";
	desc.textContent = "Ask your coding agent to create one for you:";
	panel.appendChild(desc);

	// Code block with copy button
	const codeBlock = document.createElement("div");
	codeBlock.className = "vw-empty__code";

	const code = document.createElement("code");
	code.textContent = "/videowright new video";
	codeBlock.appendChild(code);

	const copyBtn = renderCopyButton("/videowright new video");
	codeBlock.appendChild(copyBtn);

	panel.appendChild(codeBlock);

	// Docs link
	const docsLine = document.createElement("p");
	docsLine.className = "vw-empty__docs";

	const docsText = document.createTextNode("New to Videowright? ");
	docsLine.appendChild(docsText);

	const docsLink = document.createElement("a");
	docsLink.className = "vw-empty__docs-link";
	docsLink.href = "https://github.com/scosman/videowright";
	docsLink.target = "_blank";
	docsLink.rel = "noopener noreferrer";
	docsLink.textContent = "Read the docs →";
	docsLine.appendChild(docsLink);

	panel.appendChild(docsLine);

	return panel;
}
