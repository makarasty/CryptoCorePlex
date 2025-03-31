import * as fs from "fs";

// Початкова перестановка IP (64 елементи)
const IP: number[] = [
	58, 50, 42, 34, 26, 18, 10, 2, 60, 52, 44, 36, 28, 20, 12, 4, 62, 54, 46, 38,
	30, 22, 14, 6, 64, 56, 48, 40, 32, 24, 16, 8, 57, 49, 41, 33, 25, 17, 9, 1,
	59, 51, 43, 35, 27, 19, 11, 3, 61, 53, 45, 37, 29, 21, 13, 5, 63, 55, 47, 39,
	31, 23, 15, 7,
];

// Інверсна перестановка IP^-1 (64 елементи)
const IP_1: number[] = [
	40, 8, 48, 16, 56, 24, 64, 32, 39, 7, 47, 15, 55, 23, 63, 31, 38, 6, 46, 14,
	54, 22, 62, 30, 37, 5, 45, 13, 53, 21, 61, 29, 36, 4, 44, 12, 52, 20, 60, 28,
	35, 3, 43, 11, 51, 19, 59, 27, 34, 2, 42, 10, 50, 18, 58, 26, 33, 1, 41, 9,
	49, 17, 57, 25,
];

// Таблиця розширення E (48 елементів)
const E: number[] = [
	32, 1, 2, 3, 4, 5, 4, 5, 6, 7, 8, 9, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15, 16,
	17, 16, 17, 18, 19, 20, 21, 20, 21, 22, 23, 24, 25, 24, 25, 26, 27, 28, 29,
	28, 29, 30, 31, 32, 1,
];

// Таблиця перестановки P (32 елементи)
const P: number[] = [
	16, 7, 20, 21, 29, 12, 28, 17, 1, 15, 23, 26, 5, 18, 31, 10, 2, 8, 24, 14, 32,
	27, 3, 9, 19, 13, 30, 6, 22, 11, 4, 25,
];

// S-блоки (8 блоків, кожен по 4x16 = 64 числа)
const S_BOXES: number[][][] = [
	// S1
	[
		[14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
		[0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
		[4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 5, 3, 10, 0],
		[15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
	],
	// S2
	[
		[15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
		[3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
		[0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
		[13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
	],
	// S3
	[
		[10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
		[13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
		[13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
		[1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
	],
	// S4
	[
		[7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
		[13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
		[10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
		[3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
	],
	// S5
	[
		[2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
		[14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
		[4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
		[11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
	],
	// S6
	[
		[12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
		[10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
		[9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
		[4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
	],
	// S7
	[
		[4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
		[13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
		[1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
		[6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
	],
	// S8
	[
		[13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
		[1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
		[7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
		[2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11],
	],
];

// Початкова перестановка ключа PC-1 (56 біт)
const PC1: number[] = [
	57, 49, 41, 33, 25, 17, 9, 1, 58, 50, 42, 34, 26, 18, 10, 2, 59, 51, 43, 35,
	27, 19, 11, 3, 60, 52, 44, 36, 63, 55, 47, 39, 31, 23, 15, 7, 62, 54, 46, 38,
	30, 22, 14, 6, 61, 53, 45, 37, 29, 21, 13, 5, 28, 20, 12, 4,
];

// Перестановка ключа PC-2 (48 біт)
const PC2: number[] = [
	14, 17, 11, 24, 1, 5, 3, 28, 15, 6, 21, 10, 23, 19, 12, 4, 26, 8, 16, 7, 27,
	20, 13, 2, 41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48, 44, 49, 39, 56, 34,
	53, 46, 42, 50, 36, 29, 32,
];

// Кількість зсувів для кожного з 16 раундів
const SHIFTS: number[] = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

/** Циклічний зсув масиву біт довжиною 28 елементів */
function leftRotate28(bits28: number[], shift: number): number[] {
	// bits28.slice(shift) + bits28.slice(0, shift)
	return bits28.slice(shift).concat(bits28.slice(0, shift));
}

/** Перестановка: на вхід масив біт, на вихід – bits[ table[i] - 1 ] */
function permute(inputBits: number[], table: number[]): number[] {
	const output: number[] = new Array(table.length);
	for (let i = 0; i < table.length; i++) {
		output[i] = inputBits[table[i] - 1];
	}
	return output;
}

/** XOR двох бітових масивів однакової довжини */
function xor(a: number[], b: number[]): number[] {
	return a.map((bit, i) => bit ^ b[i]);
}

/** Перетворення 8 байтів у 64 біти (масив 0/1) */
function bytesToBits(data: Uint8Array): number[] {
	const bits: number[] = [];
	for (let i = 0; i < data.length; i++) {
		for (let bit = 7; bit >= 0; bit--) {
			bits.push((data[i] >> bit) & 1);
		}
	}
	return bits;
}

/** Збирання 64 біт (масив 0/1) у 8 байтів (Uint8Array) */
function bitsToBytes(bits: number[]): Uint8Array {
	const out = new Uint8Array(8);
	for (let i = 0; i < 8; i++) {
		let val = 0;
		for (let b = 0; b < 8; b++) {
			val = (val << 1) | bits[i * 8 + b];
		}
		out[i] = val;
	}
	return out;
}

/** Функція F (Feistel) */
function feistelFunction(right32: number[], subKey48: number[]): number[] {
	// 1) E-розширення (32 -> 48)
	const expanded = permute(right32, E); // 48 біт
	// 2) XOR з підключем
	const xored = xor(expanded, subKey48);
	// 3) Розбити на 8 груп по 6 біт => пройти через 8 S-box
	let sboxOut: number[] = [];
	for (let i = 0; i < 8; i++) {
		// 6 біт
		const chunk6 = xored.slice(i * 6, i * 6 + 6);
		// row = (1-й та 6-й біт), col = (2..5 біт)
		const row = (chunk6[0] << 1) | chunk6[5];
		const col =
			(chunk6[1] << 3) | (chunk6[2] << 2) | (chunk6[3] << 1) | chunk6[4];
		const sVal = S_BOXES[i][row][col]; // 4 біти на виході
		// перетворимо sVal (0..15) у 4 біти
		const fourBits = [
			(sVal >> 3) & 1,
			(sVal >> 2) & 1,
			(sVal >> 1) & 1,
			(sVal >> 0) & 1,
		];
		sboxOut = sboxOut.concat(fourBits);
	}
	// 4) Перестановка P (32 біт)
	const out32 = permute(sboxOut, P);
	return out32;
}

/** Генеруємо 16 підключів (K1..K16) з 64-бітного ключа */
function generateSubKeys(key8Bytes: Uint8Array): number[][] {
	// Перетворити ключ (8 байт = 64 біт) у бітовий масив
	const keyBits64 = bytesToBits(key8Bytes);
	// Застосовуємо PC-1 (вилучить 8 біт парності, залишиться 56)
	const perm56 = permute(keyBits64, PC1);
	let C = perm56.slice(0, 28);
	let D = perm56.slice(28, 56);

	const subKeys: number[][] = [];
	for (let i = 0; i < 16; i++) {
		C = leftRotate28(C, SHIFTS[i]);
		D = leftRotate28(D, SHIFTS[i]);
		// З'єднати C+D (56 біт)
		const CD = C.concat(D);
		// Застосувати PC-2 (56 -> 48)
		const K = permute(CD, PC2);
		subKeys.push(K);
	}
	return subKeys;
}

// --------------------------------------------------
// Експортовані функції: Шифрування/дешифрування блоку
// та обробка файлів у режимі ECB
// --------------------------------------------------

/**
 * Шифрує блок 8 байт (64 біти) за допомогою DES (ECB, 1 блок)
 */
export function desEncryptBlock(
	data8: Uint8Array,
	key8: Uint8Array,
	preSubKeys?: number[][],
): Uint8Array {
	const blockBits = bytesToBits(data8); // 64 біт
	// Початкова перестановка IP
	let permBlock = permute(blockBits, IP); // 64 біт
	let left = permBlock.slice(0, 32);
	let right = permBlock.slice(32, 64);

	// Підключі
	const subKeys = preSubKeys ?? generateSubKeys(key8);

	// 16 раундів
	for (let i = 0; i < 16; i++) {
		const temp = right.slice(); // копія
		const fOut = feistelFunction(right, subKeys[i]);
		right = xor(left, fOut);
		left = temp;
	}
	// swap
	const concat64 = right.concat(left);
	// IP^-1
	const cipherBits = permute(concat64, IP_1);
	// 64 біт -> 8 байт
	return bitsToBytes(cipherBits);
}

/**
 * Дешифрує блок 8 байт (64 біти) за допомогою DES (ECB, 1 блок)
 */
export function desDecryptBlock(
	data8: Uint8Array,
	key8: Uint8Array,
	preSubKeys?: number[][],
): Uint8Array {
	const blockBits = bytesToBits(data8);
	// Початкова перестановка
	let permBlock = permute(blockBits, IP);
	let left = permBlock.slice(0, 32);
	let right = permBlock.slice(32, 64);

	let subKeys = preSubKeys ?? generateSubKeys(key8);
	// Для дешифрування – обернений порядок ключів
	subKeys = subKeys.slice().reverse();

	// 16 раундів
	for (let i = 0; i < 16; i++) {
		const temp = right.slice();
		const fOut = feistelFunction(right, subKeys[i]);
		right = xor(left, fOut);
		left = temp;
	}
	// swap
	const concat64 = right.concat(left);
	// IP^-1
	const plainBits = permute(concat64, IP_1);
	return bitsToBytes(plainBits);
}

/** Шифрування цілого файлу в режимі ECB (8-байтні блоки) */
export function desEncryptFile(
	inputPath: string,
	outputPath: string,
	key8: Uint8Array,
) {
	const data = fs.readFileSync(inputPath);
	// PKCS#7-подібне доповнення
	const padLen = 8 - (data.length % 8);
	const padded = Buffer.concat([data, Buffer.alloc(padLen, padLen)]);

	const subKeys = generateSubKeys(key8);
	const outChunks: Buffer[] = [];

	for (let i = 0; i < padded.length; i += 8) {
		const block = padded.subarray(i, i + 8);
		const enc = desEncryptBlock(block, key8, subKeys);
		outChunks.push(Buffer.from(enc));
	}
	fs.writeFileSync(outputPath, Buffer.concat(outChunks));
}

/** Розшифрування цілого файлу в режимі ECB */
export function desDecryptFile(
	inputPath: string,
	outputPath: string,
	key8: Uint8Array,
) {
	const data = fs.readFileSync(inputPath);
	const subKeys = generateSubKeys(key8);
	const outChunks: Buffer[] = [];

	for (let i = 0; i < data.length; i += 8) {
		const block = data.subarray(i, i + 8);
		const dec = desDecryptBlock(block, key8, subKeys);
		outChunks.push(Buffer.from(dec));
	}
	const decrypted = Buffer.concat(outChunks);
	// Зчитаємо останній байт, який містить довжину доповнення
	const padLen = decrypted[decrypted.length - 1];
	const realData = decrypted.subarray(0, decrypted.length - padLen);

	fs.writeFileSync(outputPath, realData);
}
