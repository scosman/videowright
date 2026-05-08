/**
 * Minimal argv parser wrapping node:util parseArgs.
 * Extracts the subcommand from argv[2], then parses remaining flags.
 */

import { parseArgs } from "node:util";

export type Command = "dev" | "script" | "help" | "version";

export interface ParsedArgs {
	command: Command;
	positional?: string;
	flags: {
		port?: number;
		write?: boolean;
		verbose?: boolean;
	};
}

const KNOWN_COMMANDS = new Set<string>(["dev", "script"]);

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
			write: { type: "boolean", default: false },
			verbose: { type: "boolean", default: false },
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

	return {
		command: subcommand as Command,
		positional: positionals[0],
		flags: {
			port,
			write: values.write as boolean,
			verbose: values.verbose as boolean,
		},
	};
}
