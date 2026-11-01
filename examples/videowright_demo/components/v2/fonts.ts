import "./v2.css";

// Every face demo_v2 draws with: the style's three (tokens.css) and the wordmark's Outfit
// (v2.css). All use font-display: block, so no frame can show a fallback face once loaded.
const FACES: Array<[font: string, text?: string]> = [
	['600 64px "Archivo"'],
	['500 64px "JetBrains Mono"'],
	['400 64px "ME Symbols"', "✓"],
	['600 64px "Outfit"', "videowright"],
];

/**
 * Resolves once every demo_v2 face is loaded. Returns undefined (nothing to await) when they
 * already are: awaiting document.fonts.load() always resumes on a later task, and in a render
 * that task can land inside a frame, so play() would start off the frame grid and frames would
 * differ from run to run. The first segment loads all four faces during boot, so later mounts
 * never wait.
 */
export function fontsReady(): Promise<unknown> | undefined {
	if (FACES.every(([font, text]) => document.fonts.check(font, text))) return undefined;
	return Promise.all(FACES.map(([font, text]) => document.fonts.load(font, text)));
}
