import * as fs from "fs";
import { randomBytes } from "crypto";
import { modPow } from "../utils.js";

// Алгоритм Евкліда для НСД
function gcd(a: bigint, b: bigint): bigint {
	return b === 0n ? a : gcd(b, a % b);
}

// Розширений алгоритм Евкліда для знаходження оберненого
function extendedEuclid(
	a: bigint,
	b: bigint,
): { g: bigint; x: bigint; y: bigint } {
	if (b === 0n) {
		return { g: a, x: 1n, y: 0n };
	}
	// Здійснюємо розподіл a = q*b + r
	const q = a / b; // цілочисельне ділення bigInt
	const r = a % b;

	// Рекурсивно викликаємо для (b, r)
	const { g, x, y } = extendedEuclid(b, r);
	// Тоді x, y оновлюються
	return { g, x: y, y: x - q * y };
}

// Функція обчислення мультиплікативного оберненого a^-1 (mod m)
function modInverse(a: bigint, m: bigint): bigint {
	const { g, x } = extendedEuclid(a, m);
	if (g !== 1n) {
		throw new Error("modInverse does not exist (a і m не взаємно-прості)");
	}
	// Приводимо x до проміжку [0, m-1]
	return ((x % m) + m) % m;
}

// Спрощена (і недосконала!) перевірка на простоту
function isProbablePrime(num: bigint): boolean {
	if (num < 2n) return false;
	if (num % 2n === 0n) return num === 2n;

	// Проста перевірка поділом до 1000
	const limit = 1000n;
	for (let k = 3n; k < limit; k += 2n) {
		if (num % k === 0n && num !== k) {
			return false;
		}
	}
	return true; // За спрощеною логікою "мабуть просте"
}

// Генерація випадкового простого числа з ~bits біт
function generatePrime(bits: number): bigint {
	while (true) {
		// Генеруємо випадкові байти
		const buf = randomBytes(Math.ceil(bits / 8));
		let p = bytesToBigInt(buf);
		// Установити старший біт (щоб справді було ~bits)
		p |= 1n << BigInt(bits - 1);
		// Забезпечимо непарність
		p |= 1n;

		// Перевіримо на простоту (дуже спрощено)
		if (isProbablePrime(p)) {
			return p;
		}
		// Інакше пробуємо знову
	}
}

function bytesToBigInt(bytes: Uint8Array): bigint {
	let x = 0n;
	for (const b of bytes) {
		x = (x << 8n) | BigInt(b);
	}
	return x;
}

// Перетворення buffer <-> bigint
function bufferToBigInt(buf: Buffer): bigint {
	let val = 0n;
	for (let b of buf.values()) {
		val = (val << 8n) + BigInt(b);
	}
	return val;
}

function bigIntToBuffer(num: bigint): Buffer {
	// Без фіксованої довжини
	let hexStr = num.toString(16);
	if (hexStr.length % 2) {
		hexStr = "0" + hexStr;
	}
	return Buffer.from(hexStr, "hex");
}

// Щоб зберігати блочні шифротексти фіксованої довжини
function bigIntToFixedBuffer(num: bigint, length: number): Buffer {
	const buf = bigIntToBuffer(num);
	if (buf.length < length) {
		const fill = Buffer.alloc(length - buf.length, 0);
		return Buffer.concat([fill, buf]);
	} else {
		return buf;
	}
}

export interface RSAKeyPair {
	n: bigint;
	e: bigint;
	d: bigint;
}

export function generateRSAKeyPair(bitLength = 512): RSAKeyPair {
	// 1) Вибір простих p, q ~ bitLength/2
	const half = Math.floor(bitLength / 2);
	const p = generatePrime(half);
	const q = generatePrime(half);
	const n = p * q;
	const phi = (p - 1n) * (q - 1n);

	// 2) Вибираємо e
	const e = 65537n; // найпоширеніший варіант

	if (gcd(e, phi) !== 1n) {
		throw new Error(
			"e=65537 не взаємно просте з phi. Спробуйте інший розмір/спосіб",
		);
	}

	// 3) d = e^-1 mod phi
	const d = modInverse(e, phi);

	return { n, e, d };
}

/**
 * Шифрування числа M: (M^e) mod n
 */
export function rsaEncryptNumber(M: bigint, n: bigint, e: bigint): bigint {
	return modPow(M, e, n);
}

/**
 * Дешифрування числа C: (C^d) mod n
 */
export function rsaDecryptNumber(C: bigint, n: bigint, d: bigint): bigint {
	return modPow(C, d, n);
}

export function rsaEncryptFile(
	inputPath: string,
	outputPath: string,
	n: bigint,
	e: bigint,
) {
	// розмір блоку = (bitLength(n) - 1) / 8
	const bitLen = n.toString(2).length;
	const blockSize = Math.floor((bitLen - 1) / 8);

	const data = fs.readFileSync(inputPath);
	const outChunks: Buffer[] = [];

	for (let i = 0; i < data.length; i += blockSize) {
		const chunk = data.subarray(i, i + blockSize);
		const mVal = bufferToBigInt(chunk);
		const cVal = rsaEncryptNumber(mVal, n, e);

		// Запишемо за фіксованою довжиною blockSize+1 (щоби точно вмістити)
		const encBuf = bigIntToFixedBuffer(cVal, blockSize + 1);
		outChunks.push(encBuf);
	}
	fs.writeFileSync(outputPath, Buffer.concat(outChunks));
}

/**
 * Наївне дешифрування файлу (блоки по (blockSize+1)).
 */
export function rsaDecryptFile(
	inputPath: string,
	outputPath: string,
	n: bigint,
	d: bigint,
) {
	const data = fs.readFileSync(inputPath);
	const bitLen = n.toString(2).length;
	const blockSize = Math.floor((bitLen - 1) / 8);
	const encBlockSize = blockSize + 1;

	const outChunks: Buffer[] = [];

	for (let i = 0; i < data.length; i += encBlockSize) {
		const block = data.subarray(i, i + encBlockSize);
		const cVal = bufferToBigInt(block);
		const mVal = rsaDecryptNumber(cVal, n, d);
		const decBuf = bigIntToBuffer(mVal);
		outChunks.push(decBuf);
	}
	fs.writeFileSync(outputPath, Buffer.concat(outChunks));
}
