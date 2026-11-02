import type { Transition } from "videowright";

// Motion Engineering camera push: the camera drives forward through the content. Only the
// content layers move. Every Motion Engineering scene has the same grid, vignette and grain
// at camera identity, so the outgoing copies are hidden at once and the incoming ones carry
// straight through: one instrument, the camera moving. The outgoing content grows past the
// lens and clears; the incoming content arrives from further down the axis and settles. The
// key light glides to the new focal point, and the HUD hands over to the incoming scene's as
// the push starts (the outgoing scene has stopped: its timecode would freeze). Falls back to
// moving whole slots for scenes without a .me-stage. Reverses (pulls back) for backward
// navigation.
const mePush: Transition = async (outgoing, incoming, ctx) => {
	const root = getComputedStyle(document.documentElement);
	const token = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
	const duration = ctx.duration ?? 700;
	const settle = token("--ease-settle", "cubic-bezier(0.16, 1, 0.3, 1)");
	const sweep = token("--ease-sweep", "cubic-bezier(0.45, 0, 0.55, 1)");
	// Ease-in cubic: the content accelerates toward the lens while it is still visible.
	const accelerate = "cubic-bezier(0.32, 0, 0.67, 0)";
	const forward = ctx.direction !== "backward";
	const [past, arrive] = forward ? [2.0, 0.8] : [0.8, 1.25];

	const outStage = outgoing.querySelector<HTMLElement>(".me-stage");
	const inStage = incoming.querySelector<HTMLElement>(".me-stage");
	const layered = Boolean(
		outStage?.querySelector(".me-world") && inStage?.querySelector(".me-world"),
	);
	const contentOf = (stage: HTMLElement | null) => [
		...(stage?.querySelectorAll<HTMLElement>(".me-world > *") ?? []),
	];
	// The outgoing scene's fixed layers (grid, light, grain and its HUD) are hidden at once: the
	// incoming scene's carry straight through. The HUD chrome is the same in every scene, so the
	// incoming HUD takes over on the push's first frame with only its readouts changed and its
	// timecode already running (the outgoing scene has stopped: its timecode would freeze).
	const hiddenLayers: HTMLElement[] = [];
	if (layered && outStage) {
		outStage.style.background = "transparent";
		for (const layer of outStage.children) {
			const keep = layer.classList.contains("me-world");
			if (layer instanceof HTMLElement && !keep) {
				layer.style.opacity = "0";
				hiddenLayers.push(layer);
			}
		}
	}

	// The outgoing slot is on top: its content passes the lens over the incoming scene.
	outgoing.style.zIndex = "2";
	incoming.style.zIndex = "1";
	const animations: Animation[] = [];
	for (const el of layered ? contentOf(outStage) : [outgoing]) {
		animations.push(
			el.animate(
				[
					{ transform: "scale(1)", filter: "blur(0px)" },
					{ transform: `scale(${past})`, filter: "blur(6px)" },
				],
				{ duration: duration * 0.45, easing: accelerate, fill: "forwards" },
			),
			el.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: duration * 0.2,
				delay: duration * 0.25,
				fill: "forwards",
			}),
		);
	}
	const arriving: Animation[] = [];
	for (const el of layered ? contentOf(inStage) : [incoming]) {
		arriving.push(
			el.animate([{ transform: `scale(${arrive})` }, { transform: "none" }], {
				duration: duration * 0.6,
				delay: duration * 0.4,
				easing: settle,
				fill: "both",
			}),
			el.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: duration * 0.25,
				delay: duration * 0.4,
				fill: "both",
			}),
		);
	}
	animations.push(...arriving);
	if (layered && outStage && inStage) {
		// The key light glides from the old focal point to the new one, on the sweep's ease.
		const outKey = outStage.querySelector<HTMLElement>(".me-key");
		const inKey = inStage.querySelector<HTMLElement>(".me-key");
		if (outKey && inKey) {
			const from = getComputedStyle(outKey).backgroundPosition;
			const to = getComputedStyle(inKey).backgroundPosition;
			animations.push(
				inKey.animate([{ backgroundPosition: from }, { backgroundPosition: to }], {
					duration,
					easing: sweep,
				}),
			);
		}
	}
	// Parallax: the grid plane leans in a little as the camera passes over it.
	const grid = layered ? inStage?.querySelector<HTMLElement>(".me-grid") : null;
	if (grid) {
		animations.push(
			grid.animate(
				[
					{ transform: "scale(1)" },
					{ transform: "scale(1.03)", offset: 0.45 },
					{ transform: "scale(1)" },
				],
				{ duration, easing: "ease-in-out" },
			),
		);
	}

	try {
		await Promise.all(animations.map((a) => a.finished));
	} finally {
		// The arriving layers end at rest; drop their animations so nothing lingers.
		for (const a of arriving) a.cancel();
		if (outStage) outStage.style.background = "";
		for (const layer of hiddenLayers) layer.style.opacity = "";
		outgoing.style.zIndex = "";
		incoming.style.zIndex = "";
	}
};

export default mePush;
