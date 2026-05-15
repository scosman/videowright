/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { parseRoute } from "../../src/cli/entry/router.js";

const knownSlugs = new Set(["demo_video", "landing_page", "onboarding"]);

describe("parseRoute", () => {
	it("parseRoute_home_root", () => {
		const route = parseRoute("/", knownSlugs);
		expect(route).toEqual({ kind: "home" });
	});

	it("parseRoute_home_empty", () => {
		const route = parseRoute("", knownSlugs);
		expect(route).toEqual({ kind: "home" });
	});

	it("parseRoute_video_with_trailing_slash", () => {
		const route = parseRoute("/demo_video/", knownSlugs);
		expect(route).toEqual({ kind: "video", slug: "demo_video" });
	});

	it("parseRoute_video_without_trailing_slash", () => {
		const route = parseRoute("/demo_video", knownSlugs);
		expect(route).toEqual({ kind: "video", slug: "demo_video" });
	});

	it("parseRoute_video_other_slug", () => {
		const route = parseRoute("/landing_page/", knownSlugs);
		expect(route).toEqual({ kind: "video", slug: "landing_page" });
	});

	it("parseRoute_unknown_slug", () => {
		const route = parseRoute("/nonexistent/", knownSlugs);
		expect(route).toEqual({ kind: "not_found", attemptedPath: "/nonexistent/" });
	});

	it("parseRoute_deep_path", () => {
		const route = parseRoute("/a/b/c", knownSlugs);
		expect(route).toEqual({ kind: "not_found", attemptedPath: "/a/b/c" });
	});

	it("parseRoute_slug_with_encoded_chars", () => {
		const slugs = new Set(["my video"]);
		const route = parseRoute("/my%20video/", slugs);
		expect(route).toEqual({ kind: "video", slug: "my video" });
	});

	it("parseRoute_multiple_trailing_slashes", () => {
		const route = parseRoute("/demo_video///", knownSlugs);
		expect(route).toEqual({ kind: "video", slug: "demo_video" });
	});
});
