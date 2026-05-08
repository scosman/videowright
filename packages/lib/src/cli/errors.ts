/**
 * Typed error classes for the CLI.
 */

/** A user-facing error with an optional actionable hint. Exit code 1. */
export class UserError extends Error {
	override name = "UserError";
	hint?: string;

	constructor(message: string, hint?: string) {
		super(message);
		this.hint = hint;
	}
}
