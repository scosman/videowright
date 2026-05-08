/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import cut from "../../src/player/transitions/cut.js";
import fade from "../../src/player/transitions/fade.js";
import { slideDown, slideLeft, slideRight, slideUp } from "../../src/player/transitions/slide.js";
import type { TransitionContext } from "../../src/types.js";

// ---- Helpers ----

function makeSlots(): [HTMLElement, HTMLElement] {
	const outgoing = document.createElement("div");
	const incoming = document.createElement("div");
	return [outgoing, incoming];
}

function forwardCtx(duration?: number): TransitionContext {
	return { direction: "forward", duration };
}

function backwardCtx(duration?: number): TransitionContext {
	return { direction: "backward", duration };
}

// ---- Tests ----

describe("cut transition", () => {
	it("completes near-instantly", async () => {
		const [outgoing, incoming] = makeSlots();
		const start = performance.now();
		await cut(outgoing, incoming, forwardCtx());
		const elapsed = performance.now() - start;
		expect(elapsed).toBeLessThan(16);
	});

	it("hides outgoing and shows incoming", async () => {
		const [outgoing, incoming] = makeSlots();
		await cut(outgoing, incoming, forwardCtx());
		expect(outgoing.style.visibility).toBe("hidden");
		expect(incoming.style.visibility).toBe("visible");
	});
});

describe("WAAPI transitions", () => {
	// ---- WAAPI mock (scoped to this describe) ----

	interface MockAnimation {
		finished: Promise<void>;
		keyframes: Keyframe[];
		options: KeyframeAnimationOptions;
	}

	let animations: MockAnimation[];
	let originalAnimate: typeof Element.prototype.animate | undefined;

	function mockAnimate(
		this: HTMLElement,
		keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
		options?: number | KeyframeAnimationOptions,
	): Animation {
		const kf = Array.isArray(keyframes) ? keyframes : [];
		const opts = typeof options === "number" ? { duration: options } : (options ?? {});
		const anim: MockAnimation = {
			finished: Promise.resolve(),
			keyframes: kf,
			options: opts,
		};
		animations.push(anim);
		return anim as unknown as Animation;
	}

	beforeEach(() => {
		animations = [];
		originalAnimate = Element.prototype.animate;
		Element.prototype.animate = mockAnimate;
	});

	afterEach(() => {
		animations = [];
		if (originalAnimate) {
			Element.prototype.animate = originalAnimate;
		}
	});

	describe("fade transition", () => {
		it("resolves", async () => {
			const [outgoing, incoming] = makeSlots();
			await fade(outgoing, incoming, forwardCtx());
			expect(animations).toHaveLength(2);
		});

		it("uses default duration when not specified", async () => {
			const [outgoing, incoming] = makeSlots();
			await fade(outgoing, incoming, forwardCtx());
			expect(animations[0].options.duration).toBe(400);
			expect(animations[1].options.duration).toBe(400);
		});

		it("uses custom duration from context", async () => {
			const [outgoing, incoming] = makeSlots();
			await fade(outgoing, incoming, forwardCtx(800));
			expect(animations[0].options.duration).toBe(800);
		});

		it("animates opacity on both elements", async () => {
			const [outgoing, incoming] = makeSlots();
			await fade(outgoing, incoming, forwardCtx());
			// Outgoing: 1 -> 0
			expect(animations[0].keyframes[0]).toEqual({ opacity: 1 });
			expect(animations[0].keyframes[1]).toEqual({ opacity: 0 });
			// Incoming: 0 -> 1
			expect(animations[1].keyframes[0]).toEqual({ opacity: 0 });
			expect(animations[1].keyframes[1]).toEqual({ opacity: 1 });
		});

		it("uses fill forwards", async () => {
			const [outgoing, incoming] = makeSlots();
			await fade(outgoing, incoming, forwardCtx());
			expect(animations[0].options.fill).toBe("forwards");
			expect(animations[1].options.fill).toBe("forwards");
		});
	});

	describe("slide transitions", () => {
		it("slideLeft resolves with forward direction", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideLeft(outgoing, incoming, forwardCtx());
			expect(animations).toHaveLength(2);
		});

		it("slideRight resolves", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideRight(outgoing, incoming, forwardCtx());
			expect(animations).toHaveLength(2);
		});

		it("slideUp resolves", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideUp(outgoing, incoming, forwardCtx());
			expect(animations).toHaveLength(2);
		});

		it("slideDown resolves", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideDown(outgoing, incoming, forwardCtx());
			expect(animations).toHaveLength(2);
		});

		it("slideLeft uses default 500ms duration", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideLeft(outgoing, incoming, forwardCtx());
			expect(animations[0].options.duration).toBe(500);
		});

		it("slide uses custom duration from context", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideLeft(outgoing, incoming, forwardCtx(1000));
			expect(animations[0].options.duration).toBe(1000);
		});

		it("slideLeft forward moves outgoing left and incoming from right", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideLeft(outgoing, incoming, forwardCtx());

			// Outgoing moves to the left (-100%,0)
			const outKf = animations[0].keyframes;
			expect(outKf[0]).toEqual({ transform: "translate(0,0)" });
			expect(outKf[1]).toEqual({ transform: "translate(-100%,0)" });

			// Incoming comes from the right (100%,0) to (0,0)
			const inKf = animations[1].keyframes;
			expect(inKf[0]).toEqual({ transform: "translate(100%,0)" });
			expect(inKf[1]).toEqual({ transform: "translate(0,0)" });
		});

		it("slideLeft backward flips to slideRight direction", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideLeft(outgoing, incoming, backwardCtx());

			// With backward, slideLeft becomes slideRight:
			// Outgoing moves right (100%,0)
			const outKf = animations[0].keyframes;
			expect(outKf[1]).toEqual({ transform: "translate(100%,0)" });

			// Incoming comes from left (-100%,0)
			const inKf = animations[1].keyframes;
			expect(inKf[0]).toEqual({ transform: "translate(-100%,0)" });
		});

		it("slideRight backward flips to slideLeft direction", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideRight(outgoing, incoming, backwardCtx());

			// With backward, slideRight becomes slideLeft:
			const outKf = animations[0].keyframes;
			expect(outKf[1]).toEqual({ transform: "translate(-100%,0)" });

			const inKf = animations[1].keyframes;
			expect(inKf[0]).toEqual({ transform: "translate(100%,0)" });
		});

		it("slideUp backward flips to slideDown direction", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideUp(outgoing, incoming, backwardCtx());

			// With backward, slideUp becomes slideDown:
			const outKf = animations[0].keyframes;
			expect(outKf[1]).toEqual({ transform: "translate(0,100%)" });

			const inKf = animations[1].keyframes;
			expect(inKf[0]).toEqual({ transform: "translate(0,-100%)" });
		});

		it("slideDown backward flips to slideUp direction", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideDown(outgoing, incoming, backwardCtx());

			// With backward, slideDown becomes slideUp:
			const outKf = animations[0].keyframes;
			expect(outKf[1]).toEqual({ transform: "translate(0,-100%)" });

			const inKf = animations[1].keyframes;
			expect(inKf[0]).toEqual({ transform: "translate(0,100%)" });
		});

		it("uses fill forwards", async () => {
			const [outgoing, incoming] = makeSlots();
			await slideLeft(outgoing, incoming, forwardCtx());
			expect(animations[0].options.fill).toBe("forwards");
			expect(animations[1].options.fill).toBe("forwards");
		});
	});
});
