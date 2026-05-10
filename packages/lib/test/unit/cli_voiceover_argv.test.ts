import { describe, expect, it } from "vitest";
import { ArgvError, parseArgv } from "../../src/cli/argv.js";

describe("argv parser: --voiceover flag", () => {
	it("render_accepts_voiceover_slug", () => {
		const result = parseArgv(["render", "--voiceover", "narrator-warm"]);
		expect(result.command).toBe("render");
		expect(result.flags.voiceover).toBe("narrator-warm");
	});

	it("render_accepts_voiceover_none", () => {
		const result = parseArgv(["render", "--voiceover", "none"]);
		expect(result.command).toBe("render");
		expect(result.flags.voiceover).toBe("none");
	});

	it("record_accepts_voiceover_slug", () => {
		const result = parseArgv(["record", "--voiceover", "v1"]);
		expect(result.command).toBe("record");
		expect(result.flags.voiceover).toBe("v1");
	});

	it("record_accepts_voiceover_none", () => {
		const result = parseArgv(["record", "--voiceover", "none"]);
		expect(result.command).toBe("record");
		expect(result.flags.voiceover).toBe("none");
	});

	it("dev_rejects_voiceover_flag", () => {
		expect(() => parseArgv(["dev", "--voiceover", "v1"])).toThrow(ArgvError);
		expect(() => parseArgv(["dev", "--voiceover", "v1"])).toThrow(
			'--voiceover is only valid for the "render" and "record" commands',
		);
	});

	it("script_rejects_voiceover_flag", () => {
		expect(() => parseArgv(["script", "--voiceover", "v1"])).toThrow(ArgvError);
	});

	it("no_voiceover_flag_leaves_undefined", () => {
		const result = parseArgv(["render"]);
		expect(result.flags.voiceover).toBeUndefined();
	});

	it("voiceover_with_positional_and_other_flags", () => {
		const result = parseArgv([
			"render",
			"videos/demo/timeline.ts",
			"--voiceover",
			"take-3",
			"--fps",
			"30",
			"--verbose",
		]);
		expect(result.command).toBe("render");
		expect(result.positional).toBe("videos/demo/timeline.ts");
		expect(result.flags.voiceover).toBe("take-3");
		expect(result.flags.fps).toBe(30);
		expect(result.flags.verbose).toBe(true);
	});
});
