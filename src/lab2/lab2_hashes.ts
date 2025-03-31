import { Buffer } from "buffer";

export function md5(data: Buffer): Buffer {
	// Ініціалізація (у little-endian)
	let A = 0x67452301;
	let B = 0xefcdab89;
	let C = 0x98badcfe;
	let D = 0x10325476;

	// Доповнюємо дані (згідно специфікації MD5)
	const originalLength = data.length;
	// Спочатку додаємо 0x80
	const bitLen = originalLength * 8;
	// Формуємо копію
	let msg = Buffer.concat([data, Buffer.from([0x80])]);
	// Доповнюємо нулями поки довжина %64 != 56
	while (msg.length % 64 !== 56) {
		msg = Buffer.concat([msg, Buffer.from([0x00])]);
	}
	// Додаємо 64-біт довжини (little-endian)
	const lenBuf = Buffer.alloc(8, 0);
	lenBuf.writeUInt32LE(bitLen & 0xffffffff, 0);
	lenBuf.writeUInt32LE(Math.floor(bitLen / 0x100000000), 4);
	msg = Buffer.concat([msg, lenBuf]);

	// Основний цикл обробки по 512 біт (64 байти)
	for (let i = 0; i < msg.length; i += 64) {
		const block = msg.subarray(i, i + 64);
		// Розбиваємо на 16 слів M[j], j=0..15 (little-endian)
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = block.readUInt32LE(j * 4);
		}

		// Зберігаємо
		let a = A;
		let b = B;
		let c = C;
		let d = D;

		// MD5 helper functions
		function F(x: number, y: number, z: number) {
			return (x & y) | (~x & z);
		}
		function G(x: number, y: number, z: number) {
			return (x & z) | (y & ~z);
		}
		function H(x: number, y: number, z: number) {
			return x ^ y ^ z;
		}
		function I(x: number, y: number, z: number) {
			return y ^ (x | ~z);
		}

		function rotateLeft(x: number, n: number) {
			return (x << n) | (x >>> (32 - n));
		}

		function round(
			func: (x: number, y: number, z: number) => number,
			a: number,
			b: number,
			c: number,
			d: number,
			xVal: number,
			s: number,
			t: number,
		) {
			const res = (a + func(b, c, d) + xVal + t) >>> 0;
			return (b + rotateLeft(res, s)) >>> 0;
		}

		// 64 кругових операції, 4 раунди
		// Коефіцієнти T
		const K = new Uint32Array([
			0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
			0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
			0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
			0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
			0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
			0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
			0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
			0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
			0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
			0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
			0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
		]);

		const S = [
			7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20,
			5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4,
			11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6,
			10, 15, 21,
		];

		const X = [
			0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 1, 6, 11, 0, 5, 10,
			15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 5, 8, 11, 14, 1, 4, 7, 10, 13, 0, 3, 6,
			9, 12, 15, 2, 0, 7, 14, 5, 12, 3, 10, 1, 8, 15, 6, 13, 4, 11, 2, 9,
		];

		for (let iRound = 0; iRound < 64; iRound++) {
			let fRes = 0;
			let func;
			if (iRound < 16) {
				func = F;
			} else if (iRound < 32) {
				func = G;
			} else if (iRound < 48) {
				func = H;
			} else {
				func = I;
			}
			const div16 = Math.floor(iRound / 16);
			const g = X[iRound];
			const tempD = d;
			d = c;
			c = b;
			b = round(func, a, b, c, d, M[g], S[iRound], K[iRound]);
			a = tempD;
		}

		A = (A + a) >>> 0;
		B = (B + b) >>> 0;
		C = (C + c) >>> 0;
		D = (D + d) >>> 0;
	}

	const out = Buffer.alloc(16);
	out.writeUInt32LE(A, 0);
	out.writeUInt32LE(B, 4);
	out.writeUInt32LE(C, 8);
	out.writeUInt32LE(D, 12);
	return out;
}

export function sha1(data: Buffer): Buffer {
	// Спрощена повна реалізація
	const h0 = 0x67452301;
	const h1 = 0xefcdab89;
	const h2 = 0x98badcfe;
	const h3 = 0x10325476;
	const h4 = 0xc3d2e1f0;

	// Доповнення
	const originalLen = data.length * 8;
	let msg = Buffer.concat([data, Buffer.from([0x80])]);
	while (msg.length % 64 !== 56) {
		msg = Buffer.concat([msg, Buffer.from([0])]);
	}
	const lenBuf = Buffer.alloc(8);
	lenBuf.writeUInt32BE(Math.floor(originalLen / 0x100000000), 0);
	lenBuf.writeUInt32BE(originalLen & 0xffffffff, 4);
	msg = Buffer.concat([msg, lenBuf]);

	let H0 = h0;
	let H1 = h1;
	let H2 = h2;
	let H3 = h3;
	let H4 = h4;

	for (let i = 0; i < msg.length; i += 64) {
		const block = msg.subarray(i, i + 64);
		const w = new Uint32Array(80);
		for (let j = 0; j < 16; j++) {
			w[j] = block.readUInt32BE(j * 4);
		}
		for (let j = 16; j < 80; j++) {
			const val = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
			w[j] = ((val << 1) | (val >>> 31)) >>> 0;
		}
		let a = H0;
		let b = H1;
		let c = H2;
		let d = H3;
		let e = H4;

		for (let j = 0; j < 80; j++) {
			let f = 0,
				k = 0;
			if (j < 20) {
				f = (b & c) | (~b & d);
				k = 0x5a827999;
			} else if (j < 40) {
				f = b ^ c ^ d;
				k = 0x6ed9eba1;
			} else if (j < 60) {
				f = (b & c) | (b & d) | (c & d);
				k = 0x8f1bbcdc;
			} else {
				f = b ^ c ^ d;
				k = 0xca62c1d6;
			}
			const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) >>> 0;
			e = d;
			d = c;
			c = ((b << 30) | (b >>> 2)) >>> 0;
			b = a;
			a = temp;
		}

		H0 = (H0 + a) >>> 0;
		H1 = (H1 + b) >>> 0;
		H2 = (H2 + c) >>> 0;
		H3 = (H3 + d) >>> 0;
		H4 = (H4 + e) >>> 0;
	}

	const out = Buffer.alloc(20);
	out.writeUInt32BE(H0, 0);
	out.writeUInt32BE(H1, 4);
	out.writeUInt32BE(H2, 8);
	out.writeUInt32BE(H3, 12);
	out.writeUInt32BE(H4, 16);
	return out;
}
