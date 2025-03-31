import { modPow } from "../utils";

// Генератор Парка–Міллера (LCG) з m = 2^31 - 1, a = 16807
export class ParkMillerPRNG {
	private seed: number;
	private static readonly A = 16807;
	private static readonly M = 2147483647; // 2^31 - 1
	private static readonly Q = 127773; // M / A
	private static readonly R = 2836; // M mod A

	constructor(seed: number = 123456) {
		this.seed = seed % ParkMillerPRNG.M;
		if (this.seed <= 0) {
			this.seed += ParkMillerPRNG.M - 1;
		}
	}

	nextInt(): number {
		const hi = Math.floor(this.seed / ParkMillerPRNG.Q);
		const lo = this.seed % ParkMillerPRNG.Q;
		const test = ParkMillerPRNG.A * lo - ParkMillerPRNG.R * hi;
		this.seed = test > 0 ? test : test + ParkMillerPRNG.M;
		return this.seed;
	}

	nextFloat(): number {
		return this.nextInt() / (ParkMillerPRNG.M + 1);
	}
}

// Перевірка на простоту за Рабіним–Міллером
export function rabinMillerTest(n: bigint, k: number = 16): boolean {
	if (n < 2n) return false;
	if (n === 2n || n === 3n) return true;
	if (n % 2n === 0n) return false;

	// Представимо n - 1 = 2^s * d
	let s = 0n;
	let d = n - 1n;
	while (d % 2n === 0n) {
		d /= 2n;
		s++;
	}

	// Використаємо crypto.randomBytes, або псевдо-ГПВЧ
	const tryRandom = (max: bigint): bigint => {
		let buf = new Uint8Array((max.toString(2).length + 7) >> 3);
		// можна зробити цикл генерації, щоб < max
		require("crypto").randomFillSync(buf);
		let x = BigInt("0x" + Buffer.from(buf).toString("hex"));
		return x % max;
	};

	// k раундів
	for (let i = 0; i < k; i++) {
		const a = tryRandom(n - 3n) + 2n; // від 2..n-2
		let x = modPow(a, d, n);
		if (x === 1n || x === n - 1n) {
			continue;
		}
		let skipLoop = false;
		for (let r = 1n; r < s; r++) {
			x = (x * x) % n;
			if (x === n - 1n) {
				skipLoop = true;
				break;
			}
			if (x === 1n) {
				return false;
			}
		}
		if (!skipLoop) {
			return false;
		}
	}
	return true;
}
