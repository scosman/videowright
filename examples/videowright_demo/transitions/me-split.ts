import type { Transition } from "videowright";

// Motion Engineering split: the signature sweep, opened from a line. A cyan rule draws down
// the incoming scene's split line, then splits into two beams that travel out to the frame
// edges, revealing the incoming scene behind them while the outgoing one dims. The line is
// read from the incoming scene's [data-split-x] (stage px; default the frame centre), so it
// lands on that split screen's divider and the cut ends as the divider. Backward, the split
// scene closes onto its line over the scene behind it.
const meSplit: Transition = async (outgoing, incoming, ctx) => {
	const root = getComputedStyle(document.documentElement);
	const token = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;
	const duration = ctx.duration ?? 700;
	const sweep = token("--ease-sweep", "cubic-bezier(0.45, 0, 0.55, 1)");
	const settle = token("--ease-settle", "cubic-bezier(0.16, 1, 0.3, 1)");
	const forward = ctx.direction !== "backward";
	const split = forward ? incoming : outgoing;
	const host = incoming.parentElement ?? incoming;
	const width = host.clientWidth;
	const px = width / 1920;
	const mark = split.querySelector<HTMLElement>("[data-split-x]");
	const x = (Number(mark?.dataset.splitX) || 960) * px;

	const cyan = "var(--cyan, #5bd8f5)";
	const tint = (pct: number) => `color-mix(in srgb, ${cyan} ${pct}%, transparent)`;
	const layer = document.createElement("div");
	layer.style.cssText = "position:absolute; inset:0; z-index:3; pointer-events:none";
	// A beam: a bright core with a glow, its trail over the side it has revealed.
	const beam = (trailTo: "left" | "right") => {
		const el = document.createElement("div");
		el.style.cssText = `position:absolute; top:0; bottom:0; left:${x}px; width:0`;
		const trail =
			trailTo === "left"
				? "right:0; background:linear-gradient(to left, " // trail extends left of the beam
				: "left:0; background:linear-gradient(to right, ";
		el.innerHTML = `
			<div style="position:absolute; top:0; bottom:0; ${trail}${tint(14)}, transparent); width:200px"></div>
			<div style="position:absolute; top:0; bottom:0; left:-2px; width:4px; background:${cyan}; box-shadow:0 0 16px 2px ${tint(50)}, 0 0 56px 8px ${tint(18)}"></div>
			<div style="position:absolute; top:0; bottom:0; left:-1px; width:2px; background:var(--color-fg, #e6f5fa)"></div>`;
		layer.appendChild(el);
		return el;
	};
	// The rule that draws down the split line first.
	const rule = document.createElement("div");
	// A dark knockout under the glow, so the rule reads over a light scene too.
	rule.style.cssText = `position:absolute; top:0; bottom:0; left:${x - 1}px; width:2px; background:${cyan}; box-shadow:0 0 0 2px color-mix(in srgb, var(--color-bg, #0a0e14) 60%, transparent), 0 0 14px 2px ${tint(45)}; transform-origin:50% 0`;
	layer.appendChild(rule);
	// Going right, the revealed side is to the beam's left; going left, to its right.
	const right = beam("left");
	const left = beam("right");
	host.appendChild(layer);

	const closed = `inset(0 ${width - x}px 0 ${x}px)`;
	const open = "inset(0 0 0 0)";
	const top = forward ? incoming : outgoing;
	const under = forward ? outgoing : incoming;
	if (forward) incoming.style.clipPath = closed;
	top.style.zIndex = "2";
	under.style.zIndex = "1";

	const drawFor = duration * 0.3;
	const openAt = duration * 0.24;
	const openFor = duration - openAt;
	const opening = { duration: openFor, delay: openAt, easing: sweep, fill: "both" as const };
	const [clipFrom, clipTo] = forward ? [closed, open] : [open, closed];
	const [leftFrom, leftTo] = forward ? [0, -x] : [-x, 0];
	const [rightFrom, rightTo] = forward ? [0, width - x] : [width - x, 0];
	const fade = [
		{ opacity: 0 },
		{ opacity: 1, offset: 0.1 },
		{ opacity: 1, offset: 0.78 },
		{ opacity: 0 },
	];
	const animations: Animation[] = [
		// The easing lives on the keyframes (the effect is linear), so the rule really draws:
		// down over 35% of its run (~210ms), then holds and fades as the doors open.
		rule.animate(
			forward
				? [
						{ transform: "scaleY(0)", opacity: 1, easing: settle },
						{ transform: "scaleY(1)", opacity: 1, offset: 0.35 },
						{ transform: "scaleY(1)", opacity: 0 },
					]
				: [
						{ transform: "scaleY(1)", opacity: 0 },
						{ transform: "scaleY(1)", opacity: 1, offset: 0.65, easing: settle },
						{ transform: "scaleY(0)", opacity: 1 },
					],
			forward
				? { duration: drawFor / 0.35, easing: "linear", fill: "both" }
				: {
						duration: drawFor / 0.35,
						delay: duration - drawFor / 0.35,
						easing: "linear",
						fill: "both",
					},
		),
		top.animate([{ clipPath: clipFrom }, { clipPath: clipTo }], opening),
		left.animate(
			[{ transform: `translateX(${leftFrom}px)` }, { transform: `translateX(${leftTo}px)` }],
			opening,
		),
		right.animate(
			[{ transform: `translateX(${rightFrom}px)` }, { transform: `translateX(${rightTo}px)` }],
			opening,
		),
		left.animate(forward ? fade : [...fade].reverse(), opening),
		right.animate(forward ? fade : [...fade].reverse(), opening),
		under.animate(
			forward
				? [{ filter: "brightness(1)" }, { filter: "brightness(0.72)" }]
				: [{ filter: "brightness(0.72)" }, { filter: "brightness(1)" }],
			{ duration, easing: sweep, fill: "both" },
		),
	];

	try {
		await Promise.all(animations.map((a) => a.finished));
	} finally {
		layer.remove();
		incoming.style.clipPath = "";
		outgoing.style.zIndex = "";
		incoming.style.zIndex = "";
	}
};

export default meSplit;
