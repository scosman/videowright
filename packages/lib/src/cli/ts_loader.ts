/**
 * Runtime TS module loader for Node using tsx.
 * Used by the CLI to import .ts config and timeline files without a build step.
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

/**
 * Inline ESM loader hooks that treat browser-only asset imports (.css, .svg,
 * .png, font files, etc.) as empty modules.
 *
 * Consumer timeline.ts files typically import their style's tokens.css at the
 * top level (e.g. `import '../../styles/modern/tokens.css'`). Vite handles
 * this in the browser, but when the CLI loads timeline.ts via tsx for parsing,
 * Node's ESM loader rejects the unknown extension. These hooks intercept such
 * imports and return an empty module so the CLI can parse the timeline without
 * needing the CSS content.
 *
 * The hooks are registered via `module.register()` with a data: URL to avoid
 * filesystem path issues between source (TypeScript) and compiled (JavaScript)
 * contexts.
 */
const ASSET_HOOKS_SOURCE = `
const ASSET_EXTS = new Set([
  '.css', '.scss', '.sass', '.less', '.styl', '.stylus',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico',
  '.woff', '.woff2', '.eot', '.ttf', '.otf',
]);

function isAsset(s) {
  const q = s.indexOf('?');
  const clean = q >= 0 ? s.slice(0, q) : s;
  const dot = clean.lastIndexOf('.');
  return dot >= 0 && ASSET_EXTS.has(clean.slice(dot).toLowerCase());
}

export async function resolve(specifier, context, nextResolve) {
  if (isAsset(specifier)) {
    return { url: 'asset-noop:' + specifier, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('asset-noop:')) {
    return { format: 'module', source: 'export default {};', shortCircuit: true };
  }
  return nextLoad(url, context);
}
`;

let assetHooksRegistered = false;

function ensureAssetHooks(): void {
	if (assetHooksRegistered) return;
	register(`data:text/javascript,${encodeURIComponent(ASSET_HOOKS_SOURCE)}`, import.meta.url);
	assetHooksRegistered = true;
}

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
	ensureAssetHooks();
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
