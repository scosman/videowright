import { SEGMENT_BRAND, type Segment, type SegmentSpec } from "../types.js";

/**
 * Author a segment with strict typing and brand validation.
 * Runtime guards cover JS consumers; TS strict catches at compile time.
 */
export function defineSegment(spec: SegmentSpec): Segment {
	if (!spec.id) throw new TypeError("defineSegment: id is required");
	if (!spec.play) throw new TypeError("defineSegment: play is required");
	return Object.freeze({ ...spec, [SEGMENT_BRAND]: true as const });
}
