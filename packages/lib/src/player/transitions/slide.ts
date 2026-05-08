import type { Transition, TransitionContext } from "../../types.js";

const DEFAULT_DURATION = 500;

type SlideDirection = "left" | "right" | "up" | "down";

const OPPOSITE: Record<SlideDirection, SlideDirection> = {
	left: "right",
	right: "left",
	up: "down",
	down: "up",
};

function translateValue(dir: SlideDirection): string {
	switch (dir) {
		case "left":
			return "-100%,0";
		case "right":
			return "100%,0";
		case "up":
			return "0,-100%";
		case "down":
			return "0,100%";
	}
}

function createSlide(slideDir: SlideDirection): Transition {
	return async (outgoing: HTMLElement, incoming: HTMLElement, ctx: TransitionContext) => {
		const effectiveDir = ctx.direction === "backward" ? OPPOSITE[slideDir] : slideDir;
		const duration = ctx.duration ?? DEFAULT_DURATION;

		const outTarget = translateValue(effectiveDir);
		const inSource = translateValue(OPPOSITE[effectiveDir]);

		const outAnim = outgoing.animate(
			[{ transform: "translate(0,0)" }, { transform: `translate(${outTarget})` }],
			{ duration, fill: "forwards" },
		);

		const inAnim = incoming.animate(
			[{ transform: `translate(${inSource})` }, { transform: "translate(0,0)" }],
			{ duration, fill: "forwards" },
		);

		await Promise.all([outAnim.finished, inAnim.finished]);
	};
}

export const slideLeft = createSlide("left");
export const slideRight = createSlide("right");
export const slideUp = createSlide("up");
export const slideDown = createSlide("down");
