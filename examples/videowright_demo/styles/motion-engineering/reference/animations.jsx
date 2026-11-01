// Motion Engineering: the motion vocabulary, in React.
//
// A reference, not a dependency. Videowright segments are plain DOM (see ../sample/*.ts);
// these components show the same moves for prototyping the style in React. Every duration
// and easing reads tokens.css, and every moving value is a pure function of one clock, so a
// frame depends only on time: seek it, scrub it, or render it. In a segment, drive `t` from
// ctx.clock() instead of useClock().
//
// Exports: token / ms (token readers), decodeAt / tickAt (pure helpers), useClock, RiseLines,
// Decode, TickNumber, DrawStroke, CrosshairLock, RegistrationCorners, DimensionLine,
// LeaderCallout, Release, and MotionVocabulary (a board of all of them, on a 1920 x 1080
// .me-stage).

import { createContext, useContext, useEffect, useState } from "react";

// ── Tokens ──────────────────────────────────────────────────────────────────────────────

export function token(name, fallback = "") {
	if (typeof document === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function ms(name, fallback) {
	return Number.parseFloat(token(name)) || fallback;
}

// JS twins of the easing tokens, for values computed from the clock.
const clamp01 = (p) => Math.min(Math.max(p, 0), 1);
// --ease-settle: expo-out. Every arrival.
const settle = (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * clamp01(p)));
// --ease-draw: in-out. Strokes and growing bars.
const drawEase = (p) => {
	const q = clamp01(p);
	return q < 0.5 ? 4 * q ** 3 : 1 - (-2 * q + 2) ** 3 / 2;
};
// --ease-exit: accelerating. Retractions.
const exitEase = (p) => clamp01(p) ** 3;

// ── Clock ───────────────────────────────────────────────────────────────────────────────

// Milliseconds since mount, advanced once per animation frame. Rounded so stepped values
// (ticks, decodes, timecodes) land on the same frame every time.
export function useClock(running = true) {
	const [now, setNow] = useState(0);
	useEffect(() => {
		if (!running) return undefined;
		const start = performance.now();
		let frame = requestAnimationFrame(function loop() {
			setNow(Math.round(performance.now() - start));
			frame = requestAnimationFrame(loop);
		});
		return () => cancelAnimationFrame(frame);
	}, [running]);
	return now;
}

// ── Release ─────────────────────────────────────────────────────────────────────────────

// On the scene's last cue the HUD lets go: strokes inside retract toward their start and
// marks fade, while the content stays for the transition to carry out.
const ReleaseProgress = createContext(0);

export function Release({ t, at = Number.POSITIVE_INFINITY, children }) {
	const progress = exitEase((t - at) / ms("--dur-exit", 420));
	return <ReleaseProgress.Provider value={progress}>{children}</ReleaseProgress.Provider>;
}

const useRelease = () => useContext(ReleaseProgress);

// ── Text ────────────────────────────────────────────────────────────────────────────────

// Masked line reveal: each line rises out of its .me-line mask, --stagger apart.
export function RiseLines({ lines, t, at = 0, className = "me-h1" }) {
	const duration = ms("--dur-slow", 900);
	const stagger = ms("--stagger", 80);
	return (
		<div className={className}>
			{lines.map((line, i) => {
				const rise = 112 * (1 - settle((t - at - i * stagger) / duration));
				return (
					<span className="me-line" key={line}>
						<span style={{ transform: `translateY(${rise.toFixed(2)}%)` }}>{line}</span>
					</span>
				);
			})}
		</div>
	);
}

// Mono decode: characters resolve left to right through seeded noise (never Math.random).
// For readouts and short labels, never sentences.
const NOISE = "#%&*+=<>/0123456789ABCDEFHKMNPRTUVXYZ";
export function decodeAt(text, local, perChar = 26) {
	const resolveAfter = 170;
	let out = "";
	for (let i = 0; i < text.length && local >= i * perChar; i++) {
		const ch = text[i];
		const resolved = local >= i * perChar + resolveAfter || ch === " ";
		out += resolved ? ch : NOISE[(i * 7 + Math.floor(local / 45) * 11) % NOISE.length];
	}
	return out;
}

export function Decode({ text, t, at = 0, className = "me-readout", style }) {
	return (
		<span className={className} style={style}>
			{decodeAt(text, t - at)}
		</span>
	);
}

// Numbers tick: discrete steps on the --dur-tick grid with an expo-out progress, so they
// count fast and decelerate into the value. Tabular figures keep the width still.
export function tickAt(t, at, duration, from, to) {
	const step = ms("--dur-tick", 50);
	const p = Math.min((Math.floor(Math.max(0, t - at) / step) * step) / duration, 1);
	return from + (to - from) * settle(p);
}

export function TickNumber({ to, from = 0, t, at = 0, duration = 900, format, className }) {
	const value = tickAt(t, at, duration, from, to);
	return <span className={`me-num ${className ?? ""}`}>{format ? format(value) : value}</span>;
}

// ── Strokes and marks (render inside an <svg viewBox="0 0 1920 1080">) ─────────────────────

// An eased stroke draw that retracts on release.
export function DrawStroke({
	d,
	t,
	at = 0,
	duration = ms("--dur-draw", 760),
	stroke = "var(--cyan)",
	width = 2,
}) {
	const released = useRelease();
	const shown = drawEase((t - at) / duration) * (1 - released);
	return (
		<path
			d={d}
			pathLength={1}
			fill="none"
			stroke={stroke}
			strokeWidth={width}
			strokeDasharray="1 1"
			strokeDashoffset={1 - shown}
		/>
	);
}

// The lock blink: on, dim, on, dim, on. Shared by corners and the crosshair.
function blinkAt(local) {
	const p = local / 900;
	if (p < 0) return 0;
	if (p < 0.3) return p / 0.3;
	if (p < 0.62) return 1;
	if (p < 0.7) return 0.25;
	if (p < 0.8) return 1;
	if (p < 0.88) return 0.25;
	return 1;
}

// Crosshair lock: the reticle drops in at 2.4x and 45 degrees, settles on target, blinks
// twice. A canvas-colored knockout under each stroke keeps it legible over amber. Use it on
// a point (a bar tip, a data point), never over type.
export function CrosshairLock({ cx, cy, r = 34, t, at = 0 }) {
	const released = useRelease();
	const p = settle((t - at) / 620);
	const scale = 2.4 - 1.4 * p;
	const turn = 45 * (1 - p);
	const o = r + 22;
	const ticks = `M${cx - o} ${cy}h18M${cx + o - 18} ${cy}h18M${cx} ${cy - o}v18M${cx} ${cy + o - 18}v18`;
	return (
		<g
			fill="none"
			opacity={blinkAt(t - at) * (1 - released)}
			transform={`rotate(${turn} ${cx} ${cy}) translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
			style={{ filter: "var(--glow-amber-filter)" }}
		>
			<circle cx={cx} cy={cy} r={r} stroke="var(--color-bg)" strokeWidth={7} />
			<path d={ticks} stroke="var(--color-bg)" strokeWidth={7} />
			<circle cx={cx} cy={cy} r={r} stroke="var(--amber)" strokeWidth={3} />
			<path d={ticks} stroke="var(--amber)" strokeWidth={3} />
			<circle cx={cx} cy={cy} r={4} fill="var(--amber)" />
		</g>
	);
}

// Registration corners: four amber L-brackets close in on a box from outside, then blink.
export function RegistrationCorners({ x, y, w, h, t, at = 0, pad = 14, arm = 34 }) {
	const released = useRelease();
	const p = settle((t - at) / 640);
	const corners = [
		["tl", x - pad, y - pad, 1, 1],
		["tr", x + w + pad, y - pad, -1, 1],
		["bl", x - pad, y + h + pad, 1, -1],
		["br", x + w + pad, y + h + pad, -1, -1],
	];
	return (
		<g fill="none" stroke="var(--amber)" strokeWidth={3} opacity={blinkAt(t - at) * (1 - released)}>
			{corners.map(([name, px, py, dx, dy]) => (
				<path
					key={name}
					d={`M${px} ${py + dy * arm}V${py}H${px + dx * arm}`}
					transform={`translate(${-dx * 72 * (1 - p)} ${-dy * 56 * (1 - p)})`}
				/>
			))}
		</g>
	);
}

// Dimension line: witness lines drop first, then the dimension draws out from its centre,
// then a value in a background-filled chip ticks to the measurement.
export function DimensionLine({ x0, x1, y, from, t, at = 0, value, format, chip = 220 }) {
	const released = useRelease();
	const cx = (x0 + x1) / 2;
	const measureAt = at + 420;
	const shown = t >= measureAt + 200 ? 1 - released : 0;
	return (
		<g>
			<DrawStroke d={`M${x0} ${from}V${y + 14}`} t={t} at={at} duration={420} />
			<DrawStroke d={`M${x1} ${from}V${y + 14}`} t={t} at={at} duration={420} />
			<DrawStroke d={`M${cx} ${y}H${x0}`} t={t} at={measureAt} duration={640} />
			<DrawStroke d={`M${cx} ${y}H${x1}`} t={t} at={measureAt} duration={640} />
			<g opacity={shown}>
				<rect x={cx - chip / 2} y={y - 22} width={chip} height={44} fill="var(--color-bg)" />
				<text
					x={cx}
					y={y + 10}
					textAnchor="middle"
					fill="var(--cyan)"
					className="me-readout"
					style={{ fontSize: "var(--type-mono)", textTransform: "none" }}
				>
					{format(tickAt(t, measureAt + 200, 700, 0, value))}
				</text>
			</g>
		</g>
	);
}

// Leader callout: a node locks on, a leader draws out, the label and value decode at its end.
// Amber when it marks the subject; cyan when it reports a measurement.
export function LeaderCallout({ x, y, toX, label, value, t, at = 0, color = "var(--amber)" }) {
	const released = useRelease();
	const lock = settle((t - at) / ms("--dur-normal", 520));
	const textAt = at + 420;
	return (
		<g>
			<circle
				cx={x}
				cy={y}
				r={5 + 8 * (1 - lock)}
				fill={color}
				opacity={(t >= at ? lock : 0) * (1 - released)}
			/>
			<DrawStroke d={`M${x + 8} ${y}H${toX}`} t={t} at={at + 120} duration={260} stroke={color} />
			<text x={toX + 16} y={y - 8} className="me-label" fill="var(--fg-2)">
				{decodeAt(label.toUpperCase(), t - textAt)}
			</text>
			<text x={toX + 16} y={y + 30} className="me-mono" fill={color}>
				{decodeAt(value, t - textAt - 120)}
			</text>
		</g>
	);
}

// ── Board ───────────────────────────────────────────────────────────────────────────────

// Every move on one stage, looping: draw (0 s), fill (0.2 s), annotate (0.8 s), breathe
// (always), release (5.2 s). Read it next to STYLE.md, "Motion system".
export function MotionVocabulary() {
	const clock = useClock();
	const loop = 6400;
	const t = clock % loop;
	const timecode = `T+${String(Math.floor(clock / 60000)).padStart(2, "0")}:${((clock % 60000) / 1000).toFixed(2).padStart(5, "0")}`;
	return (
		<div style={{ position: "relative", width: 1920, height: 1080 }}>
			<div className="me-stage" style={{ "--key-x": "700px", "--key-y": "520px" }}>
				<div className="me-grid" />
				<div className="me-key" />
				<div className="me-light" />
				<div className="me-world">
					<div className="me-content">
						<div style={{ position: "absolute", left: 160, top: 170 }}>
							<Decode text="MOTION VOCABULARY" t={t} at={60} className="me-label" />
						</div>
						<div style={{ position: "absolute", left: 154, top: 206 }}>
							<RiseLines lines={["Draw. Fill.", "Annotate. Breathe."]} t={t} at={200} />
						</div>
						<div
							style={{
								position: "absolute",
								left: 160,
								top: 460,
								width: 9.2 * 40 * drawEase((t - 600) / 900),
								height: 64,
								background: "var(--amber)",
								boxShadow: "var(--glow-amber)",
							}}
						/>
						<div
							className="me-panel"
							style={{ position: "absolute", left: 1180, top: 200, width: 580, height: 200 }}
						>
							<div style={{ position: "absolute", left: 32, top: 32 }}>
								<Decode text="CACHE HITS" t={t} at={600} className="me-label" />
							</div>
							<div style={{ position: "absolute", left: 28, top: 76 }}>
								<TickNumber
									to={94}
									t={t}
									at={700}
									format={(v) => `${Math.round(v)}%`}
									className="me-h1"
								/>
							</div>
						</div>
						<div style={{ position: "absolute", left: 160, top: 700 }}>
							<TickNumber
								to={4.2}
								from={1}
								t={t}
								at={1800}
								duration={1100}
								format={(v) => `${v.toFixed(1)}×`}
								className="me-hero"
							/>
						</div>
					</div>
					<svg className="me-svg" viewBox="0 0 1920 1080">
						<title>Motion Engineering annotation moves</title>
						<Release t={t} at={5200}>
							<CrosshairLock cx={528} cy={492} r={30} t={t} at={1400} />
							<DimensionLine
								x0={160}
								x1={1704}
								y={600}
								from={560}
								t={t}
								at={1000}
								value={1544}
								format={(v) => `${Math.round(v).toLocaleString("en-US")} PX`}
							/>
							<RegistrationCorners x={1180} y={200} w={580} h={200} t={t} at={2200} />
							<LeaderCallout
								x={1180}
								y={860}
								toX={1240}
								label="Changed"
								value="1 file"
								t={t}
								at={2600}
								color="var(--cyan)"
							/>
						</Release>
					</svg>
				</div>
				<div className="me-grain" />
				<div className="me-hud">
					<div className="me-frame" />
					<div className="me-hud-slot" data-at="tl">
						<span className="me-label">REF</span>
						<span className="me-label" style={{ color: "var(--fg-2)" }}>
							Motion
						</span>
					</div>
					<div className="me-hud-slot" data-at="tr">
						<span className="me-readout">{timecode}</span>
					</div>
					<div className="me-hud-slot" data-at="br">
						<span className="me-readout" style={{ color: "var(--color-muted)" }}>
							GRID 40 PX
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export default MotionVocabulary;
