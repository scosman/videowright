import { describe, expect, it } from "vitest";
import { resolveRenderParams } from "../../src/cli/render.js";
import type { Config, Timeline } from "../../src/types.js";

function makeTimeline(meta: Partial<Timeline["meta"]> = {}): Timeline {
	return {
		meta: { title: "Test", ...meta },
		segments: [],
	};
}

describe("resolveRenderParams", () => {
	it("resolve_render_params_hardcoded_fallback", () => {
		const timeline = makeTimeline();
		const config: Config = { projectStructure: "v1" };

		const result = resolveRenderParams({}, timeline, config);
		expect(result).toEqual({ width: 1920, height: 1080, fps: 60 });
	});

	it("resolve_render_params_config_defaults_override_fallback", () => {
		const timeline = makeTimeline();
		const config: Config = {
			projectStructure: "v1",
			defaults: { resolution: [3840, 2160], fps: 30 },
		};

		const result = resolveRenderParams({}, timeline, config);
		expect(result).toEqual({ width: 3840, height: 2160, fps: 30 });
	});

	it("resolve_render_params_timeline_meta_overrides_config", () => {
		const timeline = makeTimeline({ resolution: [1280, 720], fps: 24 });
		const config: Config = {
			projectStructure: "v1",
			defaults: { resolution: [3840, 2160], fps: 30 },
		};

		const result = resolveRenderParams({}, timeline, config);
		expect(result).toEqual({ width: 1280, height: 720, fps: 24 });
	});

	it("resolve_render_params_cli_args_override_all", () => {
		const timeline = makeTimeline({ resolution: [1280, 720], fps: 24 });
		const config: Config = {
			projectStructure: "v1",
			defaults: { resolution: [3840, 2160], fps: 30 },
		};

		const result = resolveRenderParams({ width: 640, height: 480, fps: 15 }, timeline, config);
		expect(result).toEqual({ width: 640, height: 480, fps: 15 });
	});

	it("resolve_render_params_partial_cli_args", () => {
		const timeline = makeTimeline({ resolution: [1280, 720], fps: 24 });
		const config: Config = { projectStructure: "v1" };

		// Only width from CLI, height and fps from timeline meta
		const result = resolveRenderParams({ width: 1920 }, timeline, config);
		expect(result).toEqual({ width: 1920, height: 720, fps: 24 });
	});

	it("resolve_render_params_config_fps_without_resolution", () => {
		const timeline = makeTimeline();
		const config: Config = {
			projectStructure: "v1",
			defaults: { fps: 30 },
		};

		const result = resolveRenderParams({}, timeline, config);
		expect(result).toEqual({ width: 1920, height: 1080, fps: 30 });
	});

	it("resolve_render_params_timeline_resolution_without_fps", () => {
		const timeline = makeTimeline({ resolution: [2560, 1440] });
		const config: Config = { projectStructure: "v1" };

		const result = resolveRenderParams({}, timeline, config);
		expect(result).toEqual({ width: 2560, height: 1440, fps: 60 });
	});

	it("resolve_render_params_mixed_sources_with_hardcoded_height_fallback", () => {
		// CLI provides width, timeline provides fps, no resolution anywhere
		// -> height falls back to hardcoded 1080
		const timeline = makeTimeline({ fps: 24 });
		const config: Config = { projectStructure: "v1" };

		const result = resolveRenderParams({ width: 800 }, timeline, config);
		expect(result).toEqual({ width: 800, height: 1080, fps: 24 });
	});
});
