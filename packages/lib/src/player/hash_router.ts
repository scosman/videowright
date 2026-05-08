/**
 * URL hash routing for the player.
 * Format: #/<segmentId>/<beat>
 */

export interface HashState {
	segmentId: string;
	beat: number;
}

const HASH_RE = /^#\/([^/]+)\/(\d+)$/;

/** Parse location.hash into a HashState, or null if absent/malformed. */
export function read(): HashState | null {
	const hash = location.hash;
	if (!hash) return null;
	const m = hash.match(HASH_RE);
	if (!m) return null;
	return { segmentId: m[1], beat: Number(m[2]) };
}

/** Write a HashState to the URL via replaceState (no history entry). */
export function write(state: HashState): void {
	history.replaceState(null, "", `#/${state.segmentId}/${state.beat}`);
}

/**
 * Read ?to=<id> query parameter. If present, returns the id,
 * removes the query, and replaces history. Returns null if absent.
 */
export function readQueryFallback(): string | null {
	const params = new URLSearchParams(location.search);
	const toId = params.get("to");
	if (!toId) return null;

	params.delete("to");
	const remaining = params.toString();
	const newUrl = location.pathname + (remaining ? `?${remaining}` : "") + location.hash;
	history.replaceState(null, "", newUrl);
	return toId;
}

/**
 * Listen for hashchange events. Calls handler with the parsed HashState
 * when the hash changes to a valid state. Returns an unsubscribe function.
 */
export function onChange(handler: (s: HashState) => void): () => void {
	const listener = () => {
		const state = read();
		if (state) {
			handler(state);
		}
	};
	window.addEventListener("hashchange", listener);
	return () => window.removeEventListener("hashchange", listener);
}
