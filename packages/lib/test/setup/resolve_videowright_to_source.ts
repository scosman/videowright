/**
 * Point Node-side `videowright` imports at the library source for the test run.
 *
 * vitest.config.ts aliases `videowright` to src/index.ts, but that alias only
 * applies to modules Vite loads. Consumer files loaded through tsx (loadModule,
 * e.g. the demo's videowright.config.ts) are imported by Node itself, which
 * resolves `videowright` through node_modules to dist/, which is missing on a
 * clean checkout and stale after a source change. A Node resolve hook maps it
 * to source there too.
 */

import { register } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SOURCE_INDEX_URL = pathToFileURL(resolve(import.meta.dirname, "../../src/index.ts")).href;

const HOOKS_SOURCE = `
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "videowright") {
    return { url: ${JSON.stringify(SOURCE_INDEX_URL)}, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
`;

register(`data:text/javascript,${encodeURIComponent(HOOKS_SOURCE)}`);
