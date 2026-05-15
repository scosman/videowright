/**
 * Client-side router for the unified video server.
 * Parses pathname into one of three route kinds: home, video, or not_found.
 */

export type Route =
	| { kind: "home" }
	| { kind: "video"; slug: string }
	| { kind: "not_found"; attemptedPath: string };

/**
 * Parse a pathname into a Route.
 * @param pathname - window.location.pathname
 * @param knownSlugs - set of valid video slugs from ProjectInfo
 */
export function parseRoute(pathname: string, knownSlugs: Set<string>): Route {
	// Normalize: remove trailing slash, handle empty
	const cleaned = pathname.replace(/\/+$/, "") || "/";

	if (cleaned === "/") {
		return { kind: "home" };
	}

	// Check for single-segment paths like "/slug" or "/slug/"
	const segments = cleaned.split("/").filter(Boolean);
	if (segments.length === 1) {
		const slug = decodeURIComponent(segments[0]);
		if (knownSlugs.has(slug)) {
			return { kind: "video", slug };
		}
		return { kind: "not_found", attemptedPath: pathname };
	}

	// Anything deeper is not_found
	return { kind: "not_found", attemptedPath: pathname };
}

/**
 * Navigate to a new path using the History API.
 * Pushes state and dispatches a popstate event to trigger re-render.
 */
export function navigate(path: string): void {
	history.pushState({}, "", path);
	window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Register a callback for route changes (popstate events).
 * Returns a cleanup function.
 */
export function onRouteChange(cb: () => void): () => void {
	window.addEventListener("popstate", cb);
	return () => window.removeEventListener("popstate", cb);
}
