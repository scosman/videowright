declare module "virtual:vw-globals" {
	export const timelinePath: string;
	export const consumerRoot: string;
	export const audioFile: string | undefined;
	export const resolvedTiming: Record<string, number[]> | undefined;
	export const voiceoverNone: boolean | undefined;
	export const renderFps: number | undefined;
}

declare module "virtual:videowright/project" {
	import type { ProjectInfo } from "../../types.js";
	const projectInfo: ProjectInfo;
	export default projectInfo;
}
