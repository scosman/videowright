/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { parseSlugFromPath } from "../../src/cli/entry/parse_slug.js";

describe("parseSlugFromPath", () => {
	it("extracts_slug_from_valid_path", () => {
		expect(parseSlugFromPath("/video/demo_video")).toBe("demo_video");
	});

	it("extracts_slug_with_trailing_slash", () => {
		expect(parseSlugFromPath("/video/demo_video/")).toBe("demo_video");
	});

	it("decodes_percent_encoded_slug", () => {
		expect(parseSlugFromPath("/video/my%20video")).toBe("my video");
	});

	it("returns_null_for_root_path", () => {
		expect(parseSlugFromPath("/")).toBeNull();
	});

	it("returns_null_for_video_prefix_only", () => {
		expect(parseSlugFromPath("/video/")).toBeNull();
	});

	it("returns_null_for_nested_path", () => {
		expect(parseSlugFromPath("/video/slug/extra")).toBeNull();
	});

	it("returns_null_for_non_video_path", () => {
		expect(parseSlugFromPath("/other/path")).toBeNull();
	});

	it("returns_null_for_empty_string", () => {
		expect(parseSlugFromPath("")).toBeNull();
	});

	it("handles_slug_with_hyphens", () => {
		expect(parseSlugFromPath("/video/my-cool-video")).toBe("my-cool-video");
	});

	it("handles_slug_with_underscores", () => {
		expect(parseSlugFromPath("/video/my_cool_video")).toBe("my_cool_video");
	});
});
