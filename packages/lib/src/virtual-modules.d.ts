/**
 * Type declarations for Vite virtual modules.
 *
 * Placed outside src/cli/entry/ so that both tsconfig.json (which excludes
 * src/cli/entry/**) and tsconfig.test.json can see these declarations when
 * test files transitively import modules that use virtual imports.
 */

declare module "virtual:vw-globals" {
	export const timelinePath: string;
	export const consumerRoot: string;
	export const audioFile: string | undefined;
	export const resolvedTiming: Record<string, number[]> | undefined;
	export const audioTrackNone: boolean | undefined;
	export const renderFps: number | undefined;
}

declare module "virtual:videowright/project" {
	import type { ProjectInfo } from "./types.js";
	const projectInfo: ProjectInfo;
	export default projectInfo;
}

declare module "virtual:vw-segments" {
	const segments: Record<string, () => Promise<unknown>>;
	export default segments;
}
