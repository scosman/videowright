/**
 * Minimal argv parser wrapping node:util parseArgs.
 * Extracts the subcommand from argv[2], then parses remaining flags.
 */

import { parseArgs } from "node:util";

export type Command = "dev" | "render" | "help" | "version";

export interface ParsedArgs {
	command: Command;
	positional?: string;
	flags: {
		port?: number;
		verbose?: boolean;
		width?: number;
		height?: number;
		fps?: number;
		output?: string;
		audioTrack?: string;
	};
}

const KNOWN_COMMANDS = new Set<string>(["dev", "render"]);

/** Flags that only apply to the `render` command. Rejected on all other commands. */
const RENDER_ONLY_FLAGS = ["width", "height", "fps", "output"] as const;
const RENDER_ONLY_COMMANDS = new Set<Command>(["render"]);

/** Flags that apply to render. */
const AUDIO_TRACK_COMMANDS = new Set<Command>(["render"]);

export class ArgvError extends Error {
	override name = "ArgvError";
}

/**
 * Parse process.argv (or a supplied argv array).
 * Throws ArgvError on invalid input.
 */
export function parseArgv(argv?: string[]): ParsedArgs {
	const raw = argv ?? process.argv.slice(2);

	// Handle --help and --version anywhere
	if (raw.includes("--help")) {
		return { command: "help", flags: {} };
	}
	if (raw.includes("--version")) {
		return { command: "version", flags: {} };
	}

	const subcommand = raw[0];

	if (!subcommand) {
		return { command: "help", flags: {} };
	}

	if (!KNOWN_COMMANDS.has(subcommand)) {
		throw new ArgvError(`Unknown command: ${subcommand}`);
	}

	const remaining = raw.slice(1);

	const { values, positionals } = parseArgs({
		args: remaining,
		options: {
			port: { type: "string" },
			verbose: { type: "boolean", default: false },
			width: { type: "string" },
			height: { type: "string" },
			fps: { type: "string" },
			output: { type: "string" },
			"audio-track": { type: "string" },
		},
		allowPositionals: true,
		strict: true,
	});

	if (positionals.length > 1) {
		throw new ArgvError(
			`Too many positional arguments for "${subcommand}": expected at most 1, got ${positionals.length}`,
		);
	}

	const portStr = values.port as string | undefined;
	let port: number | undefined;
	if (portStr !== undefined) {
		port = Number.parseInt(portStr, 10);
		if (Number.isNaN(port) || port < 1 || port > 65535) {
			throw new ArgvError(`Invalid port: ${portStr}`);
		}
	}

	const widthStr = values.width as string | undefined;
	let width: number | undefined;
	if (widthStr !== undefined) {
		width = Number.parseInt(widthStr, 10);
		if (Number.isNaN(width) || width < 1 || width !== Number(widthStr)) {
			throw new ArgvError(`Invalid width: ${widthStr} (must be a positive integer)`);
		}
	}

	const heightStr = values.height as string | undefined;
	let height: number | undefined;
	if (heightStr !== undefined) {
		height = Number.parseInt(heightStr, 10);
		if (Number.isNaN(height) || height < 1 || height !== Number(heightStr)) {
			throw new ArgvError(`Invalid height: ${heightStr} (must be a positive integer)`);
		}
	}

	const fpsStr = values.fps as string | undefined;
	let fps: number | undefined;
	if (fpsStr !== undefined) {
		fps = Number.parseInt(fpsStr, 10);
		if (Number.isNaN(fps) || fps < 1 || fps > 120) {
			throw new ArgvError(`Invalid fps: ${fpsStr}`);
		}
	}

	const command = subcommand as Command;

	// Reject render-only flags on commands that don't support them
	if (!RENDER_ONLY_COMMANDS.has(command)) {
		for (const flag of RENDER_ONLY_FLAGS) {
			if (values[flag] !== undefined) {
				throw new ArgvError(`--${flag} is only valid for the "render" command`);
			}
		}
	}

	// Reject --audio-track on commands that don't support it
	const audioTrack = values["audio-track"] as string | undefined;
	if (audioTrack !== undefined && !AUDIO_TRACK_COMMANDS.has(command)) {
		throw new ArgvError(`--audio-track is only valid for the "render" command`);
	}

	return {
		command,
		positional: positionals[0],
		flags: {
			port,
			verbose: values.verbose as boolean,
			width,
			height,
			fps,
			output: values.output as string | undefined,
			audioTrack,
		},
	};
}
