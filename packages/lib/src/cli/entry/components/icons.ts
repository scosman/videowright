/**
 * Inline SVG icons (Lucide-style).
 * Each function returns an SVG string. 16px default, stroke-width 1.5, currentColor.
 */

const ICON_ATTRS =
	'xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export function iconDownload(): string {
	return `<svg ${ICON_ATTRS}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
}

export function iconCopy(): string {
	return `<svg ${ICON_ATTRS}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
}

export function iconCheck(): string {
	return `<svg ${ICON_ATTRS}><polyline points="20 6 9 17 4 12"/></svg>`;
}

export function iconX(): string {
	return `<svg ${ICON_ATTRS}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}

export function iconChevronRight(): string {
	return `<svg ${ICON_ATTRS}><polyline points="9 18 15 12 9 6"/></svg>`;
}

export function iconChevronDown(): string {
	return `<svg ${ICON_ATTRS}><polyline points="6 9 12 15 18 9"/></svg>`;
}

export function iconChevronUp(): string {
	return `<svg ${ICON_ATTRS}><polyline points="18 15 12 9 6 15"/></svg>`;
}

export function iconArrowLeft(): string {
	return `<svg ${ICON_ATTRS}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
}
