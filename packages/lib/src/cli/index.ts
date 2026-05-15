/**
 * videowright CLI main logic.
 * Parses argv, dispatches to dev, script, record, and render subcommands.
 * The binary entry point is bin.ts (not this file).
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ArgvError, type ParsedArgs, parseArgv } from "./argv.js";
import { UserError } from "./errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readVersion(): string {
	try {
		// Walk up from dist/cli/ or src/cli/ to find package.json
		let dir = __dirname;
		for (let i = 0; i < 5; i++) {
			const pkgPath = resolve(dir, "package.json");
			try {
				const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
				if (pkg.name === "videowright") return pkg.version;
			} catch {
				// not found here, keep going up
			}
			dir = dirname(dir);
		}
		return "0.0.0";
	} catch {
		return "0.0.0";
	}
}

const HELP_TEXT = `Usage: videowright <command> [options]

Commands:
  dev             Start the dev server (homepage at http://localhost:5173/)
  script [path]   Generate voiceover script
  record [path]   Auto-advance playback for visual review or external screen capture
  render [path]   Deterministic frame-by-frame export via JS time injection + ffmpeg

Options:
  --port <n>            Dev server port (default: 5173)
  --write               Write script to file instead of stdout
  --width <n>           Video width in pixels (render only, default: 1920)
  --height <n>          Video height in pixels (render only, default: 1080)
  --fps <n>             Frames per second (render only, default: 60)
  --output <path>       Output file path (render only, default: output.mp4)
  --voiceover <slug>    Use voiceover from voiceovers/<slug>/ (render, record)
  --voiceover none      Disable voiceover (ignore default_voiceover)
  --verbose             Show extra detail
  --help                Show this help
  --version             Show version
`;

function formatError(message: string, hint?: string, verbose?: boolean, stack?: string): string {
	let out = `videowright: ${message}`;
	if (hint) {
		out += `\nhint: ${hint}`;
	}
	if (verbose && stack) {
		out += `\n\n${stack}`;
	}
	return out;
}

export async function main(argv?: string[]): Promise<number> {
	let parsed: ParsedArgs;
	try {
		parsed = parseArgv(argv);
	} catch (e) {
		if (e instanceof ArgvError) {
			console.error(formatError(e.message));
			return 1;
		}
		throw e;
	}

	const { command, positional, flags } = parsed;

	if (command === "help") {
		console.log(HELP_TEXT);
		return 0;
	}

	if (command === "version") {
		console.log(readVersion());
		return 0;
	}

	const cwd = process.cwd();

	try {
		if (command === "dev") {
			const { runDev } = await import("./dev.js");
			const result = await runDev({
				cwd,
				port: flags.port,
				verbose: flags.verbose,
			});
			console.log(`\n  videowright dev server running at ${result.url}\n`);
			// Keep alive until Ctrl-C
			await new Promise<void>((resolve) => {
				const onSignal = () => {
					process.removeListener("SIGINT", onSignal);
					process.removeListener("SIGTERM", onSignal);
					result.close().then(() => resolve());
				};
				process.on("SIGINT", onSignal);
				process.on("SIGTERM", onSignal);
			});
			return 0;
		}

		if (command === "script") {
			const { runScript } = await import("./script_cmd.js");
			const result = await runScript({
				cwd,
				positional,
				write: flags.write,
				verbose: flags.verbose,
			});
			if (result.writtenTo) {
				console.log(`Script written to ${result.writtenTo}`);
			} else {
				process.stdout.write(result.markdown);
			}
			return 0;
		}

		if (command === "record") {
			const { runRecord } = await import("./record.js");
			const result = await runRecord({
				cwd,
				positional,
				verbose: flags.verbose,
				voiceover: flags.voiceover,
			});
			console.log(
				`\n  videowright record running at ${result.url}\n  No mp4 output -- use "videowright render" for export.\n`,
			);
			// Keep alive until Ctrl-C (same pattern as dev)
			await new Promise<void>((resolve) => {
				const onSignal = () => {
					process.removeListener("SIGINT", onSignal);
					process.removeListener("SIGTERM", onSignal);
					result.close().then(() => resolve());
				};
				process.on("SIGINT", onSignal);
				process.on("SIGTERM", onSignal);
			});
			return 0;
		}

		if (command === "render") {
			const { runRender } = await import("./render.js");
			const result = await runRender({
				cwd,
				positional,
				width: flags.width,
				height: flags.height,
				fps: flags.fps,
				output: flags.output,
				verbose: flags.verbose,
				voiceover: flags.voiceover,
			});
			console.log(
				`\n  Rendered ${result.frames} frames (${result.duration.toFixed(1)}s) to ${result.outputPath}\n`,
			);
			return 0;
		}
	} catch (e) {
		if (e instanceof UserError) {
			console.error(formatError(e.message, e.hint));
			return 1;
		}
		// System error -- always print stack per spec
		const error = e instanceof Error ? e : new Error(String(e));
		console.error(formatError(error.message, undefined, true, error.stack));
		return 2;
	}

	// Should not reach here
	return 0;
}
