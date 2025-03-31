import { modPow } from "../utils";

function gcd(a: bigint, b: bigint): bigint {
	return b === 0n ? a : gcd(b, a % b);
}

export function noKeyAttackRSA(c: bigint, e: bigint, n: bigint): bigint {
	for (let m = 0n; m < n; m++) {
		if (modPow(m, e, n) === c) {
			return m;
		}
	}
	return -1n;
}
