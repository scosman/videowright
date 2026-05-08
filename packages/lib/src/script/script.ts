import type { SegmentLoaderMap } from "../timeline/index.js";
import type { Timeline } from "../types.js";

/**
 * Walk a timeline's segments in order, load each module, read the voiceover field,
 * and concatenate into a Markdown document.
 *
 * Segments without a voiceover field are listed under a trailing note.
 */
export async function script(
	timeline: Timeline,
	segmentLoaders: SegmentLoaderMap,
): Promise<string> {
	const lines: string[] = [];
	const noVoSegments: string[] = [];

	lines.push(`# ${timeline.meta.title}`);
	lines.push("");

	const missingLoaderIds: string[] = [];

	for (const entry of timeline.segments) {
		const loader = segmentLoaders.get(entry.id);
		if (!loader) {
			missingLoaderIds.push(entry.id);
			continue;
		}

		const mod = await loader();
		const segment = mod.default;

		if (segment.voiceover) {
			lines.push(`## ${entry.id}`);
			lines.push(segment.voiceover);
			lines.push("");
		} else {
			noVoSegments.push(entry.id);
		}
	}

	if (missingLoaderIds.length > 0) {
		console.warn(`script: no loader found for segment(s): ${missingLoaderIds.join(", ")}`);
	}

	if (noVoSegments.length > 0) {
		lines.push("---");
		lines.push("");
		lines.push(`*No voiceover: ${noVoSegments.join(", ")}*`);
		lines.push("");
	}

	return lines.join("\n");
}
