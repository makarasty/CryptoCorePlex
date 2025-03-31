import * as fs from "fs";

interface BmpHeader {
	fileSize: number;
	dataOffset: number;
	width: number;
	height: number;
	bpp: number; // bits per pixel
}

// Прочитати заголовок BMP (спрощено, для 24 bpp)
function readBmpHeader(buf: Buffer): BmpHeader {
	const fileType = buf.readUInt16LE(0);
	if (fileType !== 0x4d42) {
		throw new Error("Not a BMP file (no 'BM' signature)");
	}
	const fileSize = buf.readUInt32LE(2);
	const dataOffset = buf.readUInt32LE(10);
	const dibSize = buf.readUInt32LE(14);
	const width = buf.readInt32LE(18);
	const height = buf.readInt32LE(22);
	const planes = buf.readUInt16LE(26);
	const bpp = buf.readUInt16LE(28);
	if (bpp !== 24) {
		throw new Error("Only 24-bit BMP is supported in this example");
	}
	return { fileSize, dataOffset, width, height, bpp };
}

// Вбудувати повідомлення (message) в BMP (24-bit), метод LSB
export function embedMessageLSB(
	bmpPath: string,
	outPath: string,
	message: Buffer,
) {
	const bmp = fs.readFileSync(bmpPath);
	const header = readBmpHeader(bmp);
	// Читаємо «тіло» растрових даних
	const pixelDataOffset = header.dataOffset;
	const pixelData = bmp.subarray(pixelDataOffset);

	// Порахуємо, скільки байтів доступно.
	// 24 bpp => кожен піксель має 3 байти, кожен байт – 1 біт на повідомлення (якщо лише 1 LSB)
	// отже 3 біт на піксель.
	// Тут реалізуємо найпростіший варіант: 1 біт/байт => 3 біт / піксель
	// Кількість пікселів = width*height
	// maxBits = 3 * width*height
	const pixelCount = header.width * header.height;
	const maxBits = 3 * pixelCount;
	const msgBits = message.length * 8;
	if (msgBits > maxBits) {
		throw new Error("Повідомлення завелике для вбудовування");
	}

	// Вбудуємо спочатку 32 біти розміру повідомлення, а потім самі дані
	// Загальна кількість біт = 32 + msgBits
	if (32 + msgBits > maxBits) {
		throw new Error("Повідомлення + довжина не поміщається");
	}

	const totalBits = 32 + msgBits;
	// Перетворимо довжину і тіло у один бітовий масив
	const lengthBuf = Buffer.alloc(4);
	lengthBuf.writeUInt32LE(message.length, 0);
	const combined = Buffer.concat([lengthBuf, message]);
	const bitArray: number[] = [];
	for (let i = 0; i < combined.length; i++) {
		const byteVal = combined[i];
		for (let b = 0; b < 8; b++) {
			bitArray.push((byteVal >> b) & 1);
		}
	}
	// bitArray має totalBits елементів

	// Впроваджуємо в pixelData (LSB кожного байта).
	// Припустимо, що кожен байт R/G/B - використовуємо 1 біт
	for (let i = 0; i < totalBits; i++) {
		const bit = bitArray[i];
		// Замінимо LSB pixelData[i]
		pixelData[i] = (pixelData[i] & 0xfe) | bit;
	}

	// Зберігаємо результат
	const outBuf = Buffer.from(bmp);
	// Замінюємо ділянку растрових даних
	pixelData.copy(outBuf, pixelDataOffset);
	fs.writeFileSync(outPath, outBuf);
}

// Витягти повідомлення LSB
export function extractMessageLSB(bmpPath: string): Buffer {
	const bmp = fs.readFileSync(bmpPath);
	const header = readBmpHeader(bmp);
	const pixelDataOffset = header.dataOffset;
	const pixelData = bmp.subarray(pixelDataOffset);

	// Спочатку читаємо 32 біти (довжина)
	let lengthBits: number[] = [];
	for (let i = 0; i < 32; i++) {
		lengthBits.push(pixelData[i] & 1);
	}
	// перетворюємо на число
	let length = 0;
	for (let i = 0; i < 4; i++) {
		let val = 0;
		for (let b = 0; b < 8; b++) {
			const bitIndex = i * 8 + b;
			val |= lengthBits[bitIndex] << b;
		}
		length |= val << (i * 8);
	}
	// length - це розмір повідомлення в байтах
	const totalBits = 32 + length * 8;
	const msgBits = pixelData.subarray(32, 32 + length * 8); // Псевдо, треба акуратно

	// Зберемо бітове подання
	const bitsArray: number[] = [];
	for (let i = 32; i < 32 + length * 8; i++) {
		bitsArray.push(pixelData[i] & 1);
	}
	// Збираємо у байти
	const out = Buffer.alloc(length);
	for (let i = 0; i < length; i++) {
		let val = 0;
		for (let b = 0; b < 8; b++) {
			const bitIndex = i * 8 + b;
			val |= bitsArray[bitIndex] << b;
		}
		out[i] = val;
	}
	return out;
}
