import type { Transition } from "../../types.js";

/**
 * Instantaneous transition: hide outgoing, show incoming. No animation.
 */
const cut: Transition = async (outgoing, incoming, _ctx) => {
	outgoing.style.visibility = "hidden";
	incoming.style.visibility = "visible";
};

export default cut;
