import type { Config } from "../types.js";

/**
 * Identity function for typed config authoring in videowright.config.ts.
 */
export function defineConfig(config: Config): Config {
	return config;
}
