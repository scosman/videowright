import { describe, expect, it } from "vitest";
import { defineConfig } from "../../src/segment/defineConfig.js";
import type { Config } from "../../src/types.js";

describe("defineConfig", () => {
	it("returns_typed_config", () => {
		const config: Config = {
			projectStructure: "v1",
			defaults: {
				resolution: [1920, 1080],
				fps: 60,
				aspectRatio: "16:9",
			},
		};

		const result = defineConfig(config);
		expect(result).toBe(config);
	});

	it("handles_minimal_config", () => {
		const config: Config = { projectStructure: "v1" };
		const result = defineConfig(config);
		expect(result).toBe(config);
		expect(result.projectStructure).toBe("v1");
	});
});
