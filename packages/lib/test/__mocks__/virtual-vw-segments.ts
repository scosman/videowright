/**
 * Mock for the virtual:vw-segments Vite virtual module.
 * Used by vitest when tests import modules that depend on this virtual module.
 */
const segments: Record<string, () => Promise<unknown>> = {};
export default segments;
