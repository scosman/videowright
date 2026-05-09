import * as echarts from "echarts";
import { defineSegment } from "videowright";
import { palette } from "../../styles/tokens.js";

let host: HTMLElement | null = null;
let chart: echarts.ECharts | null = null;

const initialData = [320, 280, 400, 350, 290, 450];
const updatedData = [580, 620, 780, 690, 510, 920];
const categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default defineSegment({
	id: "feature-echarts",
	advances: [2.5, 5.0],
	voiceover: "Real product data. ECharts, your charting library, your component library, your UI.",

	mount(el) {
		host = el;
		el.style.cssText = `
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			width: 100%;
			height: 100%;
			background: #07070d;
			gap: 1.5rem;
		`;

		el.innerHTML = `
			<div style="font-family: Inter, system-ui, sans-serif; font-size: 1rem; font-weight: 600; color: #5c5c78; letter-spacing: 0.15em; text-transform: uppercase;">ECharts</div>
			<div class="chart-container" style="width: 800px; height: 420px;"></div>
			<div class="chart-label" style="font-family: Inter, system-ui, sans-serif; font-size: 1.1rem; color: #9898b0; font-weight: 500;">Monthly active users</div>
		`;
	},

	async play(ctx) {
		if (!host) return;
		const container = host.querySelector(".chart-container") as HTMLElement;
		if (!container) return;

		chart = echarts.init(container, undefined, {
			renderer: "canvas",
		});

		const baseOption: echarts.EChartsOption = {
			backgroundColor: "transparent",
			grid: {
				top: 40,
				right: 30,
				bottom: 40,
				left: 60,
			},
			xAxis: {
				type: "category",
				data: categories,
				axisLine: { lineStyle: { color: "#2a2a3e" } },
				axisLabel: {
					color: palette.textSecondary,
					fontFamily: "Inter, system-ui, sans-serif",
					fontSize: 13,
				},
				axisTick: { show: false },
			},
			yAxis: {
				type: "value",
				splitLine: { lineStyle: { color: "#1a1a2e", type: "dashed" } },
				axisLabel: {
					color: palette.textMuted,
					fontFamily: "Inter, system-ui, sans-serif",
					fontSize: 12,
				},
			},
			series: [
				{
					type: "bar",
					data: initialData,
					barWidth: 40,
					itemStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: palette.accentBlue },
							{ offset: 1, color: "#1d4ed8" },
						]),
						borderRadius: [6, 6, 0, 0],
					},
					animationDuration: 800,
					animationEasing: "cubicOut",
				},
			],
			animationDuration: 800,
			animationEasing: "cubicOut",
		};

		chart.setOption(baseOption);

		ctx.signal.addEventListener("abort", () => {
			chart?.dispose();
			chart = null;
		});

		// Beat 1: update chart with new data
		await ctx.waitForNext();

		if (chart) {
			const label = host.querySelector(".chart-label");
			if (label) label.textContent = "Monthly active users (updated)";
			host.dataset.chartUpdated = "true";

			chart.setOption({
				series: [
					{
						data: updatedData,
						itemStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: palette.accentGreen },
								{ offset: 1, color: "#059669" },
							]),
						},
					},
				],
			});
		}
	},

	unmount() {
		if (chart) {
			chart.dispose();
			chart = null;
		}
		host = null;
	},
});
