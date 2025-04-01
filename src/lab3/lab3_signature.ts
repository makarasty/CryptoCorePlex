import { sha1 } from "../lab2/lab2_hashes.js";
import { modPow } from "../utils.js";

/**
 * signMessage:
 * 1) обчислює SHA-1 повідомлення,
 * 2) перетворює хеш у bigint,
 * 3) обчислює підпис: s = m^d mod n
 */
export function signMessage(msg: Buffer, n: bigint, d: bigint): bigint {
	// Хеш:
	const digest = sha1(msg); // digest типу Buffer (20 байт)
	// Перетворення у bigint
	let m = 0n;
	for (const byte of digest.values()) {
		m = (m << 8n) | BigInt(byte);
	}
	// m^d mod n
	const s = modPow(m, d, n);
	return s;
}

/**
 * verifyMessage:
 * 1) відновлює m' = s^e mod n,
 * 2) обчислює SHA-1(msg),
 * 3) звіряє, чи m' = h(msg).
 */
export function verifyMessage(
	msg: Buffer,
	signature: bigint,
	n: bigint,
	e: bigint,
): boolean {
	// m' = signature^e mod n
	const mPrime = modPow(signature, e, n);

	// обчислимо хеш повідомлення
	const digest = sha1(msg);
	let hashVal = 0n;
	for (const byte of digest.values()) {
		hashVal = (hashVal << 8n) | BigInt(byte);
	}

	return mPrime === hashVal;
}
