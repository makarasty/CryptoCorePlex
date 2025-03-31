export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
	let result = 1n;
	let b = base % mod;
	let e_ = exp;
	while (e_ > 0n) {
		if ((e_ & 1n) === 1n) {
			result = (result * b) % mod;
		}
		b = (b * b) % mod;
		e_ >>= 1n;
	}
	return result;
}
