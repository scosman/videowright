import {
	BarChart,
	type BarSeriesOption,
	LineChart,
	type LineSeriesOption,
	PieChart,
	type PieSeriesOption,
} from "echarts/charts";
import { GridComponent, type GridComponentOption } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { disposeWhenDetached } from "../../components/v2/dispose.js";
import { tickTo } from "../../components/v2/hud.js";
import { type Ticker, css, ms, tidy } from "../../components/v2/motion.js";

// Demo 2, a real charting library: ECharts on its canvas renderer, styled in the instrument's
// palette (cyan is measurement; the type is the style's own). Three charts animate in with
// ECharts' own entrance, then stream live data. ECharts animates on requestAnimationFrame and
// the page clock, both virtualised in a render; the data updates fire from ctx.clock() on a
// fixed schedule, and the data is seeded, so every render is the same.

echarts.use([LineChart, BarChart, PieChart, GridComponent, CanvasRenderer]);
type Option = echarts.ComposeOption<
	LineSeriesOption | BarSeriesOption | PieSeriesOption | GridComponentOption
>;

const MONO = "JetBrains Mono";
const POINTS = 36;
/** ms between live updates. */
const STREAM = 300;

/** Deterministic throughput: two slow waves and a little seeded jitter. */
export function throughput(i: number): number {
	const jitter = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
	return Math.round(
		4200 +
			520 * Math.sin(i / 4.2) +
			260 * Math.sin(i / 1.7 + 1) +
			160 * (jitter - Math.floor(jitter)),
	);
}

/** The line's x labels: seconds before now, every 3s (one point per STREAM ms). */
const AXIS = Array.from({ length: POINTS }, (_, i) => {
	const ago = ((POINTS - 1 - i) * STREAM) / 1000;
	if ((POINTS - 1 - i) % 10 !== 0) return "";
	return ago === 0 ? "NOW" : `-${ago} S`;
});

const SEGMENTS = ["01", "02", "03", "04", "05", "06", "07", "08"];
const barValue = (i: number, tick: number) => 18 + ((i * 37 + tick * 11) % 23) + (i === 2 ? 14 : 0);

export interface ChartsDemo {
	layer: HTMLElement;
	/** Plays the entrance `delay` ms from now, then streams. */
	play(ticker: Ticker, delay: number): void;
	/** Stops streaming `delay` ms from now (once a sweep has covered it). */
	stopAfter(delay: number): void;
	dispose(): void;
}

function panel(parent: HTMLElement, x: number, y: number, w: number, h: number, label: string) {
	const el = document.createElement("div");
	el.className = "me-panel";
	el.style.cssText = `position:absolute; left:${x}px; top:${y}px; width:${w}px; height:${h}px; box-sizing:border-box`;
	el.innerHTML = `<div class="me-label" style="position:absolute; left:32px; top:30px">${label}</div>`;
	parent.appendChild(el);
	return el;
}

function chartHost(parent: HTMLElement, x: number, y: number, w: number, h: number) {
	const el = document.createElement("div");
	el.style.cssText = `position:absolute; left:${x}px; top:${y}px; width:${w}px; height:${h}px`;
	parent.appendChild(el);
	return echarts.init(el, null, { renderer: "canvas", width: w, height: h, devicePixelRatio: 1 });
}

export function createCharts(parent: HTMLElement): ChartsDemo {
	const layer = document.createElement("div");
	layer.className = "v2-demo";
	parent.appendChild(layer);
	const cyan = css("--cyan");
	const fg2 = css("--fg-2");
	const muted = css("--color-muted");
	const border = css("--color-border");

	// Throughput: a streaming area chart with its live value.
	const top = panel(layer, 0, 0, 1100, 472, "Throughput · frames / s");
	const value = document.createElement("div");
	value.className = "me-readout-lg";
	value.style.cssText = "position:absolute; left:30px; top:64px; color:var(--color-fg)";
	value.textContent = "0";
	top.appendChild(value);
	const live = document.createElement("div");
	live.className = "me-readout";
	live.style.cssText =
		"position:absolute; right:32px; top:30px; display:flex; gap:12px; align-items:center";
	live.innerHTML = `<span data-ref="dot" style="width:12px; height:12px; border-radius:50%; background:var(--ok)"></span>LIVE`;
	top.appendChild(live);
	const line = chartHost(top, 16, 136, 1068, 320);

	// Render time per segment, and the cache hit rate.
	const left = panel(layer, 0, 504, 668, 296, "Render ms · by segment");
	const bars = chartHost(left, 16, 64, 636, 224);
	const right = panel(layer, 700, 504, 400, 296, "Cache hit");
	const donut = chartHost(right, 0, 40, 400, 256);
	const rate = document.createElement("div");
	rate.className = "me-readout-lg";
	rate.style.cssText =
		"position:absolute; left:0; right:0; top:146px; text-align:center; color:var(--color-fg)";
	rate.textContent = "0%";
	right.appendChild(rate);

	const axisLabel = { color: muted, fontFamily: MONO, fontSize: 22 };
	const lineOption = (from: number): Option => ({
		animationDuration: 1100,
		animationEasing: "cubicOut",
		animationDurationUpdate: STREAM,
		animationEasingUpdate: "linear",
		grid: { left: 92, right: 24, top: 18, bottom: 44 },
		xAxis: {
			type: "category",
			boundaryGap: false,
			// A relative time axis, like a live monitor's: the labels stay put while the data
			// streams through them (labels tied to the samples would jump on every update).
			data: AXIS,
			axisLine: { lineStyle: { color: border } },
			axisTick: { show: false },
			axisLabel: { ...axisLabel, interval: 0 },
		},
		yAxis: {
			type: "value",
			min: 3000,
			max: 5400,
			interval: 800,
			splitLine: { lineStyle: { color: border } },
			axisLabel,
		},
		series: [
			{
				type: "line",
				smooth: 0.35,
				symbol: "none",
				data: Array.from({ length: POINTS }, (_, i) => throughput(from + i)),
				lineStyle: { color: cyan, width: 3, shadowColor: cyan, shadowBlur: 12 },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: "rgba(91, 216, 245, 0.32)" },
						{ offset: 1, color: "rgba(91, 216, 245, 0)" },
					]),
				},
			},
		],
	});
	const barOption = (tick: number): Option => ({
		animationDuration: 900,
		animationEasing: "cubicOut",
		animationDelay: (i: number) => i * 60,
		animationDurationUpdate: 420,
		grid: { left: 64, right: 16, top: 16, bottom: 40 },
		xAxis: {
			type: "category",
			data: SEGMENTS,
			axisLine: { lineStyle: { color: border } },
			axisTick: { show: false },
			axisLabel,
		},
		yAxis: {
			type: "value",
			max: 60,
			interval: 20,
			splitLine: { lineStyle: { color: border } },
			axisLabel,
		},
		series: [
			{
				type: "bar",
				barWidth: 34,
				data: SEGMENTS.map((_, i) => barValue(i, tick)),
				itemStyle: { color: fg2, borderRadius: [3, 3, 0, 0] },
			},
		],
	});
	const donutOption = (hit: number): Option => ({
		animationDuration: 1100,
		animationEasing: "cubicOut",
		animationDurationUpdate: 420,
		series: [
			{
				type: "pie",
				radius: ["62%", "76%"],
				center: ["50%", "52%"],
				startAngle: 90,
				silent: true,
				label: { show: false },
				data: [
					{ value: hit, itemStyle: { color: cyan } },
					{ value: 100 - hit, itemStyle: { color: border } },
				],
			},
		],
	});

	let disposed = false;
	let stopped = false;
	return {
		layer,
		play(ticker, delay) {
			const at = ticker.now() + delay;
			let streamed = -1;
			ticker.add((t) => {
				const local = tidy(t - at);
				if (local < 0) return true;
				if (streamed < 0) {
					// ECharts' own entrance: the line draws left to right, bars grow, the ring sweeps.
					line.setOption(lineOption(0));
					bars.setOption(barOption(0));
					donut.setOption(donutOption(94));
					streamed = 0;
				}
				// Live: from 1.2s on, one new point per STREAM ms; the line shifts left.
				const step = Math.floor((local - 1200) / STREAM);
				if (step > streamed) {
					streamed = step;
					line.setOption(lineOption(step));
					if (step % 2 === 0) bars.setOption(barOption(step / 2));
					value.textContent = throughput(step + POINTS - 1).toLocaleString("en-US");
				}
				return !stopped && layer.isConnected;
			});
			tickTo(ticker, value, throughput(POINTS - 1), at + 200, 1000, (v) =>
				Math.round(v).toLocaleString("en-US"),
			);
			tickTo(ticker, rate, 94, at + 200, 1100, (v) => `${Math.round(v)}%`);
			// The live dot blinks on a steps() loop.
			(live.querySelector('[data-ref="dot"]') as HTMLElement).animate(
				[{ opacity: 1 }, { opacity: 0.25 }],
				{
					duration: 520,
					delay: delay + 1200,
					iterations: 12,
					direction: "alternate",
					easing: "steps(1, end)",
				},
			);
			for (const [i, el] of [top, left, right].entries()) {
				el.animate(
					[
						{ opacity: 0, transform: "translateY(24px)" },
						{ opacity: 1, transform: "none" },
					],
					{
						duration: ms("--dur-normal"),
						delay: delay + i * ms("--stagger"),
						easing: css("--ease-settle"),
						fill: "both",
					},
				);
			}
		},
		stopAfter(delay) {
			setTimeout(() => {
				stopped = true;
			}, delay);
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			disposeWhenDetached(layer, () => {
				for (const chart of [line, bars, donut]) chart.dispose();
			});
		},
	};
}
