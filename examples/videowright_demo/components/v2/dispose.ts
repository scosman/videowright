// Deferred disposal for GPU- or canvas-backed demos (a WebGL renderer, an ECharts instance).
// unmount() must not change the outgoing frame: the transition is still showing it, and
// disposing clears the canvas. The player removes the outgoing slot's DOM once the transition
// is done, so dispose then. Timers are virtualised in a render, so this is deterministic.

/** Calls `dispose` once `node` has left the document, checking every `every` ms. */
export function disposeWhenDetached(node: Node, dispose: () => void, every = 250): void {
	const check = () => {
		if (node.isConnected) setTimeout(check, every);
		else dispose();
	};
	setTimeout(check, every);
}
