/**
 * 404 page view.
 * Shown when the router cannot match the pathname to a known video or route.
 */

import type { ProjectInfo } from "../../../types.js";
import { navigate } from "../router.js";

export function renderNotFound(attemptedPath: string, _projectInfo: ProjectInfo): HTMLElement {
	const container = document.createElement("main");
	container.className = "vw-not-found";
	container.setAttribute(
		"style",
		[
			"display: flex",
			"flex-direction: column",
			"align-items: center",
			"justify-content: center",
			"min-height: 100vh",
			"font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif",
			"color: var(--text-primary, #f5f5f7)",
			"background: var(--bg-base, #0a0a0b)",
			"text-align: center",
			"padding: 32px",
		].join(";"),
	);

	const code = document.createElement("div");
	code.setAttribute(
		"style",
		[
			"font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
			"font-size: 64px",
			"color: var(--text-tertiary, #6e6e78)",
			"line-height: 1",
			"margin-bottom: 16px",
		].join(";"),
	);
	code.textContent = "404";
	container.appendChild(code);

	const heading = document.createElement("h1");
	heading.setAttribute(
		"style",
		["font-size: 24px", "font-weight: 600", "margin: 0 0 8px 0", "line-height: 1.3"].join(";"),
	);
	heading.textContent = "Video not found";
	container.appendChild(heading);

	const desc = document.createElement("p");
	desc.setAttribute(
		"style",
		["font-size: 14px", "color: var(--text-secondary, #a0a0a8)", "margin: 0 0 24px 0"].join(";"),
	);
	desc.textContent = `No video at ${attemptedPath}`;
	container.appendChild(desc);

	const link = document.createElement("a");
	link.setAttribute(
		"style",
		[
			"font-size: 14px",
			"color: var(--accent, #a78bfa)",
			"text-decoration: none",
			"cursor: pointer",
		].join(";"),
	);
	link.textContent = "← Back to videos";
	link.href = "/";
	link.addEventListener("click", (e) => {
		e.preventDefault();
		navigate("/");
	});
	container.appendChild(link);

	return container;
}
