/**
 * Utility to extract a video slug from a URL pathname.
 * Separated from entry_video.ts so it can be unit-tested without
 * pulling in virtual modules or the full entry bootstrap.
 */

/**
 * Extract the video slug from a pathname like `/video/<slug>` or `/video/<slug>/`.
 * Returns null if the pathname does not match the expected pattern.
 */
export function parseSlugFromPath(pathname: string): string | null {
	const match = pathname.match(/^\/video\/([^/]+)\/?$/);
	return match ? decodeURIComponent(match[1]) : null;
}
