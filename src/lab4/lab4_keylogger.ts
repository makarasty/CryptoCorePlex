import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isLogging = false;
let logStream: fs.WriteStream | null = null;

export function startKeylogger() {
	if (isLogging) {
		console.log("Keylogger already running.");
		return;
	}
	console.log(
		"Starting console-based keylogger... (натисніть Ctrl+C або введіть 'stop' для зупинки)",
	);
	isLogging = true;

	const logFilePath = path.join(__dirname, "../../../keylog_console.txt");
	logStream = fs.createWriteStream(logFilePath, { flags: "a" });

	logStream.write(`\n==== Start Logging at ${new Date().toISOString()} ====\n`);

	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.setEncoding("utf8");

	process.stdin.on("data", onKeyPress);
}

export function stopKeylogger() {
	if (!isLogging) {
		console.log("Keylogger is not running.");
		return;
	}
	isLogging = false;
	if (logStream) {
		logStream.write(
			`\n==== Stop Logging at ${new Date().toISOString()} ====\n`,
		);
		logStream.end();
		logStream = null;
	}

	process.stdin.setRawMode(false);
	process.stdin.off("data", onKeyPress);
	console.log("Keylogger stopped.");
}

function onKeyPress(chunk: string) {
	if (chunk === "\u0003") {
		// Ctrl+C
		stopKeylogger();
		return;
	}
	if (chunk === "stop") {
		stopKeylogger();
		return;
	}

	if (logStream) {
		if (chunk === "\r") {
			// ігноруємо?
		} else if (chunk === "\n") {
			logStream.write("[ENTER]\n");
		} else if (chunk === "\u0008") {
			logStream.write("[BACKSPACE]");
		} else {
			// Звичайний символ
			logStream.write(chunk);
		}
	}
}
