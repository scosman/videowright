/**
 * Input handling for the player.
 * Keyboard (window-level), click, and basic touch swipe.
 */

export type PlayerCommand =
	| "next"
	| "prev"
	| "restart"
	| "toggleHud"
	| { kind: "jumpTo"; index: number };

const SWIPE_THRESHOLD = 50;

/**
 * Attach input listeners to the host element.
 * Returns a cleanup function that removes all listeners.
 */
export function attachInput(host: HTMLElement, emit: (cmd: PlayerCommand) => void): () => void {
	const onKeydown = (e: KeyboardEvent) => {
		// Don't intercept keystrokes when a form or editable element has focus
		const targetEl = e.target as HTMLElement | null;
		const tag = targetEl?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
		if (targetEl?.isContentEditable) return;

		switch (e.key) {
			case "ArrowRight":
			case " ":
				e.preventDefault();
				emit("next");
				break;
			case "ArrowLeft":
				e.preventDefault();
				emit("prev");
				break;
			case "r":
			case "R":
				emit("restart");
				break;
			case "h":
			case "H":
				emit("toggleHud");
				break;
			default: {
				const n = Number(e.key);
				if (n >= 1 && n <= 9) {
					emit({ kind: "jumpTo", index: n - 1 });
				}
			}
		}
	};

	const onClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement | null;
		if (target?.closest(".vw-hud")) return;
		emit("next");
	};

	let touchStartX = 0;
	let touchStartY = 0;

	const onTouchStart = (e: TouchEvent) => {
		const touch = e.touches[0];
		if (touch) {
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
		}
	};

	const onTouchEnd = (e: TouchEvent) => {
		const touch = e.changedTouches[0];
		if (!touch) return;

		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;

		// Only consider horizontal swipes where dx > dy
		if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
			if (dx < 0) {
				emit("next"); // swipe left -> next
			} else {
				emit("prev"); // swipe right -> prev
			}
		}
	};

	window.addEventListener("keydown", onKeydown);
	host.addEventListener("click", onClick);
	host.addEventListener("touchstart", onTouchStart, { passive: true });
	host.addEventListener("touchend", onTouchEnd, { passive: true });

	return () => {
		window.removeEventListener("keydown", onKeydown);
		host.removeEventListener("click", onClick);
		host.removeEventListener("touchstart", onTouchStart);
		host.removeEventListener("touchend", onTouchEnd);
	};
}
