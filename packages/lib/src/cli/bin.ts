#!/usr/bin/env node

/**
 * Binary entry point for the `videowright` CLI.
 * Separated from index.ts so the module can be imported without auto-running.
 */

import { main } from "./index.js";

main().then((code) => {
	process.exitCode = code;
});
