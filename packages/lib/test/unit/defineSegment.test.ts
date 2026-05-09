import { describe, expect, it } from "vitest";
import { defineSegment } from "../../src/segment/defineSegment.js";
import { SEGMENT_BRAND, type SegmentSpec } from "../../src/types.js";

function makeSpec(overrides: Partial<SegmentSpec> = {}): SegmentSpec {
	return {
		id: "test-segment",
		advances: [1.0],
		async play() {},
		...overrides,
	};
}

describe("defineSegment", () => {
	it("returns_branded_object", () => {
		const spec = makeSpec({ voiceover: "hello", notes: "dev note" });
		const segment = defineSegment(spec);

		expect(segment[SEGMENT_BRAND]).toBe(true);
		expect(segment.id).toBe("test-segment");
		expect(segment.voiceover).toBe("hello");
		expect(segment.notes).toBe("dev note");
		expect(segment.play).toBe(spec.play);
		expect(segment.advances).toEqual([1.0]);
	});

	it("preserves_optional_lifecycle_methods", () => {
		const mount = () => {};
		const unmount = () => {};
		const next = () => true;
		const prev = () => false;

		const segment = defineSegment(makeSpec({ mount, unmount, next, prev }));

		expect(segment.mount).toBe(mount);
		expect(segment.unmount).toBe(unmount);
		expect(segment.next).toBe(next);
		expect(segment.prev).toBe(prev);
	});

	it("throws_without_id", () => {
		expect(() => defineSegment(makeSpec({ id: "" }))).toThrow(
			TypeError("defineSegment: id is required"),
		);
	});

	it("throws_without_play", () => {
		// biome-ignore lint/suspicious/noExplicitAny: intentionally testing invalid input
		const spec = { id: "no-play", advances: [1] } as any;
		expect(() => defineSegment(spec)).toThrow(TypeError("defineSegment: play is required"));
	});

	it("returns_frozen_object", () => {
		const segment = defineSegment(makeSpec());
		expect(Object.isFrozen(segment)).toBe(true);
	});

	it("throws_without_advances", () => {
		// biome-ignore lint/suspicious/noExplicitAny: intentionally testing invalid input
		const spec = { id: "no-advances", play: async () => {} } as any;
		expect(() => defineSegment(spec)).toThrow("advances is required");
	});

	it("throws_with_empty_advances", () => {
		expect(() => defineSegment(makeSpec({ advances: [] }))).toThrow("advances is required");
	});

	it("throws_with_non_positive_advance", () => {
		expect(() => defineSegment(makeSpec({ advances: [0] }))).toThrow("must be a positive number");
		expect(() => defineSegment(makeSpec({ advances: [-1] }))).toThrow("must be a positive number");
	});

	it("throws_with_non_monotonic_advances", () => {
		expect(() => defineSegment(makeSpec({ advances: [2, 1] }))).toThrow("monotonically increasing");
		expect(() => defineSegment(makeSpec({ advances: [1, 1] }))).toThrow("monotonically increasing");
	});

	it("accepts_valid_monotonic_advances", () => {
		const segment = defineSegment(makeSpec({ advances: [1, 2, 3.5] }));
		expect(segment.advances).toEqual([1, 2, 3.5]);
	});
});
