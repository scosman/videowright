import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const INSTALL_URL =
	"https://github.com/scosman/videowright/blob/main/packages/lib/skill/install/INSTALL.md";

const INSTALL_PROMPT = `Install Videowright using these instructions: ${INSTALL_URL}`;

const AGENTS = [
	{ key: "claude", label: "Claude Code", cmd: "claude" },
	{ key: "codex", label: "Codex", cmd: "codex" },
	{ key: "opencode", label: "opencode", cmd: "opencode" },
];

/** Check if a single binary is available by spawning it with --version. */
function probeAgent(cmd) {
	return new Promise((resolve) => {
		try {
			const child = spawn(cmd, ["--version"], { stdio: "ignore" });
			child.on("error", () => resolve(false));
			child.on("exit", (code) => resolve(code === 0));
		} catch {
			resolve(false);
		}
	});
}

/** Detect which supported coding agents are installed (in parallel). */
export async function detectAgents() {
	const results = await Promise.all(AGENTS.map((a) => probeAgent(a.cmd)));
	const detected = {};
	for (let i = 0; i < AGENTS.length; i++) {
		detected[AGENTS[i].key] = results[i];
	}
	return detected;
}

/**
 * Pick which agent to hand off to.
 * Returns the agent key, or null if none detected.
 */
export async function chooseAgent(detected) {
	const available = AGENTS.filter((a) => detected[a.key]);

	if (available.length === 0) return null;
	if (available.length === 1) return available[0].key;

	const rl = createInterface({ input: process.stdin, output: process.stdout });

	const lines = [
		"Multiple coding agents detected. Which would you like to install Videowright into?",
	];
	for (let i = 0; i < available.length; i++) {
		lines.push(`  ${i + 1}) ${available[i].label}`);
	}
	lines.push("");
	const numbers = available.map((_, i) => i + 1);
	const numbersText =
		numbers.length <= 1
			? String(numbers[0])
			: `${numbers.slice(0, -1).join(", ")}, or ${numbers[numbers.length - 1]}`;
	const prompt = `${lines.join("\n")}Enter ${numbersText} [1]: `;

	const answer = await new Promise((resolve) => {
		rl.question(prompt, (ans) => {
			rl.close();
			resolve(ans.trim());
		});
	});

	if (answer === "") return available[0].key;

	const index = Number.parseInt(answer, 10) - 1;
	if (index >= 0 && index < available.length) return available[index].key;

	// Invalid input — default to first
	return available[0].key;
}

/** Build the CLI command + args to launch the chosen agent with the install prompt. */
export function handoffCommand(agent) {
	switch (agent) {
		case "claude":
			return { cmd: "claude", args: [INSTALL_PROMPT] };
		case "codex":
			return { cmd: "codex", args: [INSTALL_PROMPT] };
		case "opencode":
			return { cmd: "opencode", args: ["--prompt", INSTALL_PROMPT] };
		default:
			throw new Error(`Unknown agent: ${agent}`);
	}
}

/** Spawn the agent, inheriting stdio so it takes over the terminal. */
export function spawnAgent(cmd, args) {
	const child = spawn(cmd, args, { stdio: "inherit" });

	child.on("error", (err) => {
		console.error(
			`Failed to start ${cmd}: ${err.message}\nTry running \`npm init videowright\` again.`,
		);
		process.exit(1);
	});

	child.on("exit", (code) => {
		process.exit(code ?? 0);
	});
}

function printFallback() {
	console.log("We couldn't find Claude Code, Codex, or opencode installed.");
	console.log("Install one of those, or paste this into your coding agent of choice:");
	console.log("");
	console.log(`  ${INSTALL_PROMPT}`);
}

export async function main() {
	const detected = await detectAgents();

	let agent;
	try {
		agent = await chooseAgent(detected);
	} catch {
		// Non-interactive stdin (piped/closed) — default to first detected agent
		const available = AGENTS.filter((a) => detected[a.key]);
		agent = available.length > 0 ? available[0].key : null;
	}

	if (agent === null) {
		printFallback();
		return;
	}

	const { cmd, args } = handoffCommand(agent);
	spawnAgent(cmd, args);
}
