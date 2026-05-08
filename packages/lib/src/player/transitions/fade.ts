import type { Transition } from "../../types.js";

const DEFAULT_DURATION = 400;

/**
 * Crossfade: outgoing opacity 1->0, incoming 0->1 over configurable duration.
 */
const fade: Transition = async (outgoing, incoming, ctx) => {
	const duration = ctx.duration ?? DEFAULT_DURATION;

	const outAnim = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration,
		fill: "forwards",
	});

	const inAnim = incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration,
		fill: "forwards",
	});

	await Promise.all([outAnim.finished, inAnim.finished]);
};

export default fade;
