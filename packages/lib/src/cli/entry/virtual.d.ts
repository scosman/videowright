declare module "virtual:vw-globals" {
	export const timelinePath: string;
	export const consumerRoot: string;
	export const audioFile: string | undefined;
	export const resolvedTiming: Record<string, number[]> | undefined;
	export const voiceoverNone: boolean | undefined;
	export const renderFps: number | undefined;
}
