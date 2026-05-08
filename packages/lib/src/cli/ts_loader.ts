/**
 * Runtime TS module loader for Node using tsx.
 * Used by the CLI to import .ts config and timeline files without a build step.
 */

import { pathToFileURL } from "node:url";

/**
 * Dynamically import a TypeScript module from Node at runtime.
 * Returns the module's namespace (use .default for default exports).
 *
 * ## tsx double-wrap heuristic
 *
 * When tsx loads a CommonJS-style module (or a module with `export default`),
 * it may produce a namespace like:
 *
 *   { default: { __esModule: true, default: <actual-value> } }
 *
 * This happens because tsx transpiles `export default X` to
 * `module.exports.default = X` + `module.exports.__esModule = true`, then
 * the ESM interop layer wraps the whole `module.exports` as the default export.
 *
 * We detect this pattern (an object default with both __esModule and default keys)
 * and unwrap it so callers always see `{ default: <actual-value>, ... }`.
 *
 * If tsx changes this behavior in future versions, the detection is conservative:
 * we only unwrap when both sentinel keys are present, so a legitimate object
 * with those keys would be the only false positive (extremely unlikely in practice).
 */
export async function loadModule(modulePath: string): Promise<Record<string, unknown>> {
	const { tsImport } = await import("tsx/esm/api");
	const fileUrl = pathToFileURL(modulePath).href;
	const mod = (await tsImport(fileUrl, import.meta.url)) as Record<string, unknown>;

	// Unwrap tsx double-wrapping of default exports (see doc comment above)
	const defaultExport = mod.default;
	if (
		defaultExport &&
		typeof defaultExport === "object" &&
		"__esModule" in defaultExport &&
		"default" in defaultExport
	) {
		const inner = defaultExport as Record<string, unknown>;
		return { ...mod, default: inner.default };
	}

	return mod;
}
