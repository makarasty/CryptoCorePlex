import * as fs from "fs";
import {
	bold,
	red,
	green,
	yellow,
	blue,
	cyan,
	magenta,
	white,
	bgBlue,
	bgMagenta,
	bgGreen,
	bgRed,
	bgYellow,
	underline,
	dim,
	italic,
	strikethrough,
} from "colorette";
import boxen from "boxen";

type BorderStyle = "single" | "double" | "round" | "bold" | "classic" | "none";

import { modPow } from "./utils";

import { desEncryptFile, desDecryptFile } from "./lab1/lab1_des";
import {
	generateRSAKeyPair,
	rsaEncryptFile,
	rsaDecryptFile,
} from "./lab1/lab1_rsa";

import { ParkMillerPRNG, rabinMillerTest } from "./lab2/lab2_prng";
import { md5, sha1 } from "./lab2/lab2_hashes";

import { signMessage, verifyMessage } from "./lab3/lab3_signature";
import { noKeyAttackRSA } from "./lab3/lab3_attacks";

import { startKeylogger, stopKeylogger } from "./lab4/lab4_keylogger";
import { embedMessageLSB, extractMessageLSB } from "./lab4/lab4_stego";

import * as readline from "readline";

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function questionAsync(questionText: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(questionText, (answer) => {
			resolve(answer.trim());
		});
	});
}

const menuBoxOptions = {
	padding: 1,
	margin: 0,
	borderStyle: "round" as BorderStyle,
	borderColor: "cyan",
	backgroundColor: "#000000",
};

const subMenuBoxOptions = {
	padding: 1,
	margin: 0,
	borderStyle: "round" as BorderStyle,
	borderColor: "blue",
	backgroundColor: "#000000",
};

function showMainMenu(): void {
	console.log(
		boxen(
			yellow(bold("CRYPTO CORE PLEX") + white(":")) +
				"\n\n" +
				white(bold("1)")) +
				" " +
				yellow("Лабораторна №1") +
				" " +
				dim("(DES/RSA)") +
				"\n" +
				white(bold("2)")) +
				" " +
				yellow("Лабораторна №2") +
				" " +
				dim("(PRNG, Простота, Хеші)") +
				"\n" +
				white(bold("3)")) +
				" " +
				yellow("Лабораторна №3") +
				" " +
				dim("(ЕЦП, Криптоаналіз)") +
				"\n" +
				white(bold("4)")) +
				" " +
				yellow("Лабораторна №4") +
				" " +
				dim("(Keylogger, Stego)") +
				"\n" +
				white(bold("0)")) +
				" " +
				red("Вихід"),
			menuBoxOptions,
		),
	);
}

function showLab1Menu(): void {
	console.log(
		boxen(
			yellow(bold("Лабораторна №1")) +
				" " +
				dim("(DES/RSA)") +
				"\n\n" +
				white(bold("1)")) +
				" DES: " +
				cyan("Зашифрувати файл") +
				"\n" +
				white(bold("2)")) +
				" DES: " +
				cyan("Розшифрувати файл") +
				"\n" +
				white(bold("3)")) +
				" RSA: " +
				cyan("Згенерувати ключі") +
				"\n" +
				white(bold("4)")) +
				" RSA: " +
				cyan("Зашифрувати файл") +
				"\n" +
				white(bold("5)")) +
				" RSA: " +
				cyan("Розшифрувати файл") +
				"\n" +
				white(bold("0)")) +
				" " +
				red("Повернутися в головне меню"),
			{ ...subMenuBoxOptions, borderColor: "magenta" },
		),
	);
}

function showLab2Menu(): void {
	console.log(
		boxen(
			yellow(bold("Лабораторна №2")) +
				" " +
				dim("(PRNG, Хеші)") +
				"\n\n" +
				white(bold("1)")) +
				" " +
				cyan("Демонстрація ГПВЧ") +
				" " +
				dim("(Park–Miller)") +
				"\n" +
				white(bold("2)")) +
				" " +
				cyan("Перевірка числа на простоту") +
				" " +
				dim("(Rabin–Miller)") +
				"\n" +
				white(bold("3)")) +
				" " +
				cyan("Порівняти MD5 та SHA-1") +
				" " +
				dim("(швидкість/хеш)") +
				"\n" +
				white(bold("0)")) +
				" " +
				red("Повернутися в головне меню"),
			{ ...subMenuBoxOptions, borderColor: "blue" },
		),
	);
}

function showLab3Menu(): void {
	console.log(
		boxen(
			yellow(bold("Лабораторна №3")) +
				" " +
				dim("(ЕЦП, Атаки)") +
				"\n\n" +
				white(bold("1)")) +
				" " +
				cyan("Підписати файл") +
				" " +
				dim("(RSA + SHA-1)") +
				"\n" +
				white(bold("2)")) +
				" " +
				cyan("Перевірити підпис") +
				"\n" +
				white(bold("3)")) +
				" " +
				cyan("(Демо) Атака noKeyAttackRSA") +
				" " +
				dim("на малих n") +
				"\n" +
				white(bold("0)")) +
				" " +
				red("Повернутися в головне меню"),
			{ ...subMenuBoxOptions, borderColor: "green" },
		),
	);
}

function showLab4Menu(): void {
	console.log(
		boxen(
			yellow(bold("Лабораторна №4")) +
				" " +
				dim("(Keylogger, Stego)") +
				"\n\n" +
				white(bold("1)")) +
				" " +
				cyan("Запустити keylogger") +
				" " +
				dim("(консольний варіант)") +
				"\n" +
				white(bold("2)")) +
				" " +
				cyan("Зупинити keylogger") +
				"\n" +
				white(bold("3)")) +
				" " +
				cyan("Вбудувати повідомлення в BMP") +
				" " +
				dim("(LSB)") +
				"\n" +
				white(bold("4)")) +
				" " +
				cyan("Витягти повідомлення з BMP") +
				" " +
				dim("(LSB)") +
				"\n" +
				white(bold("0)")) +
				" " +
				red("Повернутися в головне меню"),
			{ ...subMenuBoxOptions, borderColor: "yellow" },
		),
	);
}

// Для відображення результатів у гарній рамці
function showResult(title: string, content: string, color = "cyan"): void {
	console.log(
		boxen(bold(title) + "\n\n" + content, {
			padding: 1,
			margin: { top: 1, bottom: 1 },
			borderStyle: "single" as BorderStyle,
			borderColor: color,
			backgroundColor: "#000000",
		}),
	);
}

async function main() {
	console.clear();
	console.log(
		boxen(
			bold(yellow("CRYPTO CORE PLEX")) +
				"\n" +
				dim("~~~ Made by ") +
				blue("https://github.com/makarasty"),
			{
				padding: 1,
				margin: { top: 1, bottom: 1 },
				borderStyle: "double" as BorderStyle,
				borderColor: "cyan",
				backgroundColor: "#000000",
				textAlignment: "center",
			},
		),
	);

	while (true) {
		showMainMenu();
		const ans = await questionAsync(cyan("❯ Оберіть дію [0..4]: "));
		console.log();

		if (ans === "0") {
			console.log(bold(green("👋 До побачення!")));
			break;
		}

		switch (ans) {
			case "1":
				await lab1MenuLoop();
				break;
			case "2":
				await lab2MenuLoop();
				break;
			case "3":
				await lab3MenuLoop();
				break;
			case "4":
				await lab4MenuLoop();
				break;
			default:
				console.log(red("❌ Невідома команда. Спробуйте ще раз."));
		}
	}

	rl.close();
	process.exit(0);
}

async function lab1MenuLoop() {
	while (true) {
		showLab1Menu();
		const ans = await questionAsync(magenta("❯ Введіть пункт [0..5]: "));
		console.log();

		switch (ans) {
			case "0":
				return;
			case "1": {
				// DES Encrypt
				const inputFile = await questionAsync(
					yellow("📄 Шлях до вхідного файлу: "),
				);
				const outputFile = await questionAsync(
					cyan("📄 Шлях до вихідного зашифрованого файлу: "),
				);

				const desKey = new Uint8Array([
					0x13, 0x34, 0x57, 0x79, 0x9b, 0xbc, 0xdf, 0xf1,
				]);
				try {
					desEncryptFile(inputFile, outputFile, desKey);
					showResult(
						"Результат операції",
						"Файл успішно зашифровано DES.",
						"green",
					);
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "2": {
				// DES Decrypt
				const inputFile = await questionAsync(
					yellow("🔒 Шлях до зашифрованого файлу: "),
				);
				const outputFile = await questionAsync(
					cyan("📄 Шлях до вихідного розшифрованого файлу: "),
				);
				const desKey = new Uint8Array([
					0x13, 0x34, 0x57, 0x79, 0x9b, 0xbc, 0xdf, 0xf1,
				]);
				try {
					desDecryptFile(inputFile, outputFile, desKey);
					showResult("Результат операції", "Файл розшифровано DES.", "green");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "3": {
				// RSA Generate
				const bitLenStr = await questionAsync(
					yellow("🔑 Введіть довжину ключа (наприклад 512 чи 1024): "),
				);
				const bitLen = parseInt(bitLenStr) || 512;
				try {
					const { n, e, d } = generateRSAKeyPair(bitLen);
					let resultText = "RSA key pair згенеровано:\n\n";
					resultText += `n = ${n.toString()}\n\n`;
					resultText += `e = ${e.toString()}\n\n`;
					resultText += `d = ${d.toString()}\n\n`;
					resultText += bold(
						yellow("🔐 Збережіть ці ключі у безпечному місці!"),
					);

					if (bitLen < 512) {
						resultText +=
							"\n\n" +
							red("⚠️ УВАГА! Дуже малий ключ, використовуйте >= 1024 біт!");
					}

					showResult("RSA Ключі", resultText, "green");
				} catch (e: unknown) {
					showResult(
						"Помилка генерації ключа",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "4": {
				// RSA Encrypt
				const inputFile = await questionAsync(yellow("📄 Вхідний файл: "));
				const outputFile = await questionAsync(
					cyan("🔒 Вихідний зашифр. файл: "),
				);
				const nStr = await questionAsync(yellow("🔑 Введіть n (bigint): "));
				const eStr = await questionAsync(yellow("🔑 Введіть e (bigint): "));
				try {
					const n = BigInt(nStr);
					const e = BigInt(eStr);

					warnIfNTooSmall(n);

					rsaEncryptFile(inputFile, outputFile, n, e);
					showResult("Результат операції", "Файл зашифровано RSA.", "green");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "5": {
				// RSA Decrypt
				const inputFile = await questionAsync(
					yellow("🔒 Вхідний зашифр. файл: "),
				);
				const outputFile = await questionAsync(
					cyan("📄 Вихідний розшифр. файл: "),
				);
				const nStr = await questionAsync(yellow("🔑 Введіть n (bigint): "));
				const dStr = await questionAsync(yellow("🔑 Введіть d (bigint): "));
				try {
					const n = BigInt(nStr);
					const d = BigInt(dStr);

					warnIfNTooSmall(n);

					rsaDecryptFile(inputFile, outputFile, n, d);
					showResult("Результат операції", "Файл розшифровано RSA.", "green");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			default:
				console.log(red("❌ Невідомий пункт меню ЛР1."));
		}
		console.log();
	}
}

async function lab2MenuLoop() {
	while (true) {
		showLab2Menu();
		const ans = await questionAsync(blue("❯ Введіть пункт [0..3]: "));
		console.log();

		switch (ans) {
			case "0":
				return;
			case "1": {
				// PRNG
				const seedStr = await questionAsync(
					yellow("🎲 Введіть seed (наприклад 12345): "),
				);
				const seed = parseInt(seedStr) || 12345;
				const pm = new ParkMillerPRNG(seed);

				let resultText =
					"📊 Перші 10 псевдовипадкових чисел (Park–Miller):\n\n";
				for (let i = 0; i < 10; i++) {
					resultText += `${i + 1}. ${pm.nextInt().toString()}\n`;
				}

				showResult("Генератор псевдовипадкових чисел", resultText, "blue");
				break;
			}
			case "2": {
				// Rabin–Miller test
				const numStr = await questionAsync(
					yellow("🔢 Введіть число (bigint) для перевірки: "),
				);
				const num = BigInt(numStr);
				const isPrime = rabinMillerTest(num, 16);

				let resultText = `Число ${num.toString()} є простим?\n\n`;
				resultText += isPrime ? green("✅ ТАК") : red("❌ НІ");

				showResult("Перевірка на простоту", resultText, "blue");
				break;
			}
			case "3": {
				// Compare MD5 / SHA1
				const fileName = await questionAsync(
					yellow("📄 Введіть шлях до файлу: "),
				);
				try {
					const data = fs.readFileSync(fileName);
					const t0 = Date.now();
					const hMd5 = md5(data);
					const t1 = Date.now();
					const deltaMd5 = t1 - t0;

					const t2 = Date.now();
					const hSha1 = sha1(data);
					const t3 = Date.now();
					const deltaSha1 = t3 - t2;

					let resultText = `MD5:  ${hMd5.toString("hex")}\n`;
					resultText += dim(`Час обчислення: ${deltaMd5} мс\n\n`);
					resultText += `SHA1: ${hSha1.toString("hex")}\n`;
					resultText += dim(`Час обчислення: ${deltaSha1} мс`);

					showResult("Порівняння хеш-функцій", resultText, "magenta");
				} catch (e: unknown) {
					showResult(
						"Помилка читання файлу",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			default:
				console.log(red("❌ Невідомий пункт меню ЛР2."));
		}
		console.log();
	}
}

async function lab3MenuLoop() {
	while (true) {
		showLab3Menu();
		const ans = await questionAsync(green("❯ Введіть пункт [0..3]: "));
		console.log();

		switch (ans) {
			case "0":
				return;
			case "1": {
				// Підписати файл
				const fileName = await questionAsync(
					yellow("📄 Який файл підписувати? "),
				);
				const nStr = await questionAsync(yellow("🔑 RSA n (bigint): "));
				const dStr = await questionAsync(yellow("🔑 RSA d (bigint): "));
				try {
					const data = fs.readFileSync(fileName);
					const n = BigInt(nStr);
					const d = BigInt(dStr);

					warnIfNTooSmall(n);

					const signature = signMessage(data, n, d);

					let resultText = "✅ Підпис (signature) =\n\n";
					resultText += signature.toString();

					showResult("Електронний підпис", resultText, "green");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "2": {
				// Перевірити підпис
				const fileName = await questionAsync(
					yellow("📄 Який файл перевіряти? "),
				);
				const signatureStr = await questionAsync(
					yellow("🔑 Введіть signature (bigint): "),
				);
				const nStr = await questionAsync(yellow("🔑 RSA n (bigint): "));
				const eStr = await questionAsync(yellow("🔑 RSA e (bigint): "));
				try {
					const data = fs.readFileSync(fileName);
					const signature = BigInt(signatureStr);
					const n = BigInt(nStr);
					const e = BigInt(eStr);

					warnIfNTooSmall(n);

					const isOk = verifyMessage(data, signature, n, e);

					let resultText = isOk
						? green("✅ Підпис вірний!")
						: red("❌ Підпис НЕ вірний!");

					showResult("Перевірка підпису", resultText, isOk ? "green" : "red");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "3": {
				// noKeyAttackRSA
				console.log(
					magenta("🔓 Демо noKeyAttackRSA (працює на дуже малих n)..."),
				);
				const smallNStr = await questionAsync(
					yellow("🔑 Введіть мале n (bigint): "),
				);
				const eStr = await questionAsync(yellow("🔑 Введіть e (bigint): "));
				const MStr = await questionAsync(yellow("📝 Введіть M (bigint): "));
				try {
					const n = BigInt(smallNStr);
					const e_ = BigInt(eStr);
					const M = BigInt(MStr);
					// Шифротекст
					const C = modPow(M, e_, n);

					let resultText = `C = M^e mod n = ${C.toString()}\n\n`;
					resultText += dim("🔄 Запуск noKeyAttackRSA...\n\n");

					const rec = noKeyAttackRSA(C, e_, n);

					resultText += `Відновлене M = ${rec.toString()}\n\n`;
					resultText += `Збіг? → ${rec === M ? green("✅ Так") : red("❌ Ні")}`;

					showResult("Атака без ключа RSA", resultText, "magenta");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			default:
				console.log(red("❌ Невідомий пункт меню ЛР3."));
		}
		console.log();
	}
}

async function lab4MenuLoop() {
	while (true) {
		showLab4Menu();
		const ans = await questionAsync(yellow("❯ Введіть пункт [0..4]: "));
		console.log();

		switch (ans) {
			case "0":
				return;
			case "1": {
				// Запустити keylogger (консольний)
				startKeylogger();
				showResult(
					"Keylogger",
					"⌨️ Keylogger запущено. Введіть 'stop' або Ctrl+C для зупинки.",
					"cyan",
				);
				break;
			}
			case "2": {
				// Зупинити keylogger
				stopKeylogger();
				showResult("Keylogger", "✅ Keylogger зупинено.", "green");
				break;
			}
			case "3": {
				// Вбудувати повідомлення в BMP (LSB)
				const bmpIn = await questionAsync(yellow("🖼️ BMP оригінал: "));
				const bmpOut = await questionAsync(cyan("🖼️ BMP з повідомленням: "));
				const secretMsg = await questionAsync(
					yellow("🔒 Яке текстове повідомлення сховати?: "),
				);
				try {
					const secretBuf = Buffer.from(secretMsg, "utf8");
					embedMessageLSB(bmpIn, bmpOut, secretBuf);
					showResult(
						"Стеганографія",
						"✅ Повідомлення успішно вбудовано!",
						"green",
					);
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			case "4": {
				// Витягти повідомлення з BMP
				const bmpFile = await questionAsync(
					yellow("🖼️ BMP файл з прихованим повідомленням: "),
				);
				try {
					const extracted = extractMessageLSB(bmpFile);

					let resultText = "📝 Витягнуте повідомлення:\n\n";
					resultText += bold(extracted.toString("utf8"));

					showResult("Стеганографія", resultText, "magenta");
				} catch (e: unknown) {
					showResult(
						"Помилка",
						e instanceof Error ? e.toString() : String(e),
						"red",
					);
				}
				break;
			}
			default:
				console.log(red("❌ Невідомий пункт меню ЛР4."));
		}
		console.log();
	}
}

function warnIfNTooSmall(n: bigint) {
	const bitLen = n.toString(2).length; // кількість біт у n
	if (bitLen < 512) {
		showResult(
			"⚠️ Попередження",
			`Ваш n = ${n.toString()} має всього ${bitLen} біт!\nЦе занадто малий ключ RSA. Підпис чи шифрування можуть бути небезпечними.`,
			"yellow",
		);
	}
}

main().catch((err: unknown) => {
	showResult(
		"Критична помилка",
		err instanceof Error ? err.toString() : String(err),
		"red",
	);
	process.exit(1);
});
