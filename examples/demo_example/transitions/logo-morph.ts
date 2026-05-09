import type { Transition } from "videowright";

/**
 * logo-morph transition
 *
 * Coordinates a `.logo` element across the boundary of two segments using
 * a FLIP-style animation with WAAPI. Falls back to a simple crossfade
 * if `.logo` elements are not found in both slots.
 */
const logoMorph: Transition = async (outgoing, incoming, ctx) => {
	const duration = ctx.duration ?? 600;
	const outLogo = outgoing.querySelector(".logo") as HTMLElement | null;
	const inLogo = incoming.querySelector(".logo") as HTMLElement | null;

	if (!outLogo || !inLogo) {
		// Fallback: simple crossfade
		const outAnim = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration,
			fill: "forwards",
		});
		const inAnim = incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration,
			fill: "forwards",
		});
		await Promise.all([outAnim.finished, inAnim.finished]);
		return;
	}

	// FLIP: record positions
	const outRect = outLogo.getBoundingClientRect();
	const inRect = inLogo.getBoundingClientRect();

	const dx = outRect.left - inRect.left;
	const dy = outRect.top - inRect.top;
	const scaleX = outRect.width / (inRect.width || 1);
	const scaleY = outRect.height / (inRect.height || 1);

	// Fade out the outgoing segment's non-logo content
	const outNonLogo = Array.from(outgoing.children).filter(
		(child) => !child.classList.contains("logo"),
	) as HTMLElement[];
	for (const el of outNonLogo) {
		el.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: duration * 0.5,
			fill: "forwards",
		});
	}

	// Hide outgoing logo (incoming logo will take over)
	outLogo.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration: duration * 0.3,
		delay: duration * 0.2,
		fill: "forwards",
	});

	// Animate incoming logo from outgoing logo's position
	const logoAnim = inLogo.animate(
		[
			{
				transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
				opacity: 1,
			},
			{
				transform: "translate(0, 0) scale(1, 1)",
				opacity: 1,
			},
		],
		{
			duration,
			easing: "cubic-bezier(0.16, 1, 0.3, 1)",
			fill: "forwards",
		},
	);

	// Fade in the incoming segment
	const inAnim = incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
		duration: duration * 0.6,
		delay: duration * 0.3,
		fill: "forwards",
	});

	// Fade out the outgoing segment
	const outAnim = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
		duration: duration * 0.5,
		fill: "forwards",
	});

	await Promise.all([logoAnim.finished, inAnim.finished, outAnim.finished]);
};

export default logoMorph;
