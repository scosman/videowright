import { SEGMENT_BRAND, type Segment, type SegmentSpec } from "../types.js";

/**
 * Author a segment with strict typing and brand validation.
 * Runtime guards cover JS consumers; TS strict catches at compile time.
 */
export function defineSegment(spec: SegmentSpec): Segment {
	if (!spec.id) throw new TypeError("defineSegment: id is required");
	if (!spec.play) throw new TypeError("defineSegment: play is required");
	if (!spec.advances || !Array.isArray(spec.advances) || spec.advances.length === 0) {
		throw new TypeError(
			`defineSegment: advances is required and must be a non-empty array (segment "${spec.id}")`,
		);
	}
	for (let i = 0; i < spec.advances.length; i++) {
		const v = spec.advances[i];
		if (typeof v !== "number" || v <= 0 || !Number.isFinite(v)) {
			throw new TypeError(
				`defineSegment: advances[${i}] must be a positive number (segment "${spec.id}", got ${v})`,
			);
		}
		if (i > 0 && v <= spec.advances[i - 1]) {
			throw new TypeError(
				`defineSegment: advances must be monotonically increasing (segment "${spec.id}", advances[${i}]=${v} <= advances[${i - 1}]=${spec.advances[i - 1]})`,
			);
		}
	}
	return Object.freeze({ ...spec, [SEGMENT_BRAND]: true as const });
}
