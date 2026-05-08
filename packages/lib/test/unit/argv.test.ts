import { describe, expect, it } from "vitest";
import { ArgvError, parseArgv } from "../../src/cli/argv.js";

describe("argv parser", () => {
	it("argv_dev_no_args", () => {
		const result = parseArgv(["dev"]);
		expect(result.command).toBe("dev");
		expect(result.positional).toBeUndefined();
		expect(result.flags.port).toBeUndefined();
		expect(result.flags.write).toBe(false);
		expect(result.flags.verbose).toBe(false);
	});

	it("argv_dev_with_path", () => {
		const result = parseArgv(["dev", "videos/foo/timeline.ts"]);
		expect(result.command).toBe("dev");
		expect(result.positional).toBe("videos/foo/timeline.ts");
	});

	it("argv_dev_with_port", () => {
		const result = parseArgv(["dev", "--port", "3000"]);
		expect(result.command).toBe("dev");
		expect(result.flags.port).toBe(3000);
	});

	it("argv_dev_with_verbose", () => {
		const result = parseArgv(["dev", "--verbose"]);
		expect(result.command).toBe("dev");
		expect(result.flags.verbose).toBe(true);
	});

	it("argv_script_no_args", () => {
		const result = parseArgv(["script"]);
		expect(result.command).toBe("script");
		expect(result.positional).toBeUndefined();
		expect(result.flags.write).toBe(false);
	});

	it("argv_script_with_write", () => {
		const result = parseArgv(["script", "--write"]);
		expect(result.command).toBe("script");
		expect(result.flags.write).toBe(true);
	});

	it("argv_script_with_path_and_write", () => {
		const result = parseArgv(["script", "videos/demo/timeline.ts", "--write"]);
		expect(result.command).toBe("script");
		expect(result.positional).toBe("videos/demo/timeline.ts");
		expect(result.flags.write).toBe(true);
	});

	it("argv_help", () => {
		const result = parseArgv(["--help"]);
		expect(result.command).toBe("help");
	});

	it("argv_help_on_subcommand", () => {
		const result = parseArgv(["dev", "--help"]);
		expect(result.command).toBe("help");
	});

	it("argv_version", () => {
		const result = parseArgv(["--version"]);
		expect(result.command).toBe("version");
	});

	it("argv_no_args_shows_help", () => {
		const result = parseArgv([]);
		expect(result.command).toBe("help");
	});

	it("argv_unknown_command", () => {
		expect(() => parseArgv(["frob"])).toThrow(ArgvError);
		expect(() => parseArgv(["frob"])).toThrow("Unknown command: frob");
	});

	it("argv_double_positional_rejected", () => {
		expect(() => parseArgv(["dev", "a", "b"])).toThrow(ArgvError);
		expect(() => parseArgv(["dev", "a", "b"])).toThrow("Too many positional arguments");
	});

	it("argv_invalid_port", () => {
		expect(() => parseArgv(["dev", "--port", "abc"])).toThrow(ArgvError);
		expect(() => parseArgv(["dev", "--port", "abc"])).toThrow("Invalid port");
	});

	it("argv_port_out_of_range", () => {
		expect(() => parseArgv(["dev", "--port", "99999"])).toThrow(ArgvError);
	});
});
