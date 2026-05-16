/**
 * Mock for the virtual:vw-globals Vite virtual module.
 * Used by vitest when tests import modules that depend on this virtual module.
 */
export const timelinePath = "/fake/timeline.ts";
export const consumerRoot = "/fake/root";
export const audioFile: string | undefined = undefined;
export const resolvedTiming: Record<string, number[]> | undefined = undefined;
export const audioTrackNone: boolean | undefined = true;
export const renderFps: number | undefined = undefined;
