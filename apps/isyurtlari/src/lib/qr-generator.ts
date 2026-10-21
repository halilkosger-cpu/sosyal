/**
 * Bağımsız QR Kod (SVG) Üretici Motoru.
 * Dış bağımlılık gerektirmez, doğrudan SVG dizesi üretir.
 * ISO/IEC 18004 standardı QR Code Model 2.
 */

// GF(256) tablosu
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let cur = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = cur;
  EXP[i + 255] = cur;
  LOG[cur] = i;
  cur <<= 1;
  if (cur & 256) cur ^= 0x11d;
}

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP[LOG[x] + LOG[y]];
}

function rsGenPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: Uint8Array, poly: Uint8Array): Uint8Array {
  const rem = new Uint8Array(poly.length - 1);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[rem.length - 1] = 0;
    for (let j = 0; j < rem.length; j++) {
      rem[j] ^= gfMul(poly[j + 1], factor);
    }
  }
  return rem;
}

// Version 4-L (33x33) veya Version 5-L (37x37)
interface QrSpec {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  alignment: number[];
}

const SPECS: QrSpec[] = [
  { version: 1, size: 21, totalBytes: 26, dataBytes: 19, ecBytes: 7, alignment: [] },
  { version: 2, size: 25, totalBytes: 44, dataBytes: 34, ecBytes: 10, alignment: [6, 18] },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 55, ecBytes: 15, alignment: [6, 22] },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 80, ecBytes: 20, alignment: [6, 26] },
  { version: 5, size: 37, totalBytes: 134, dataBytes: 108, ecBytes: 26, alignment: [6, 30] },
  { version: 6, size: 41, totalBytes: 172, dataBytes: 136, ecBytes: 36, alignment: [6, 34] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const rawBytes = Buffer.from(text, 'utf-8');
  const spec = SPECS.find((s) => s.dataBytes >= rawBytes.length + 3) || SPECS[SPECS.length - 1];

  const { size, dataBytes, ecBytes } = spec;

  // Veri kod kelimeleri (Byte Mode: 0100)
  const bitBuf: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bitBuf.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(rawBytes.length, 8); // Karakter sayısı
  for (let i = 0; i < rawBytes.length; i++) {
    pushBits(rawBytes[i], 8);
  }
  // Terminator
  for (let i = 0; i < 4 && bitBuf.length < dataBytes * 8; i++) bitBuf.push(0);
  while (bitBuf.length % 8 !== 0) bitBuf.push(0);

  const dataArr = new Uint8Array(dataBytes);
  for (let i = 0; i < bitBuf.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bitBuf[i + j];
    dataArr[i / 8] = b;
  }

  // Padding
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  for (let i = bitBuf.length / 8; i < dataBytes; i++) {
    dataArr[i] = padBytes[padIdx % 2];
    padIdx++;
  }

  // Reed-Solomon Hata Düzeltme
  const poly = rsGenPoly(ecBytes);
  const ec = rsComputeRemainder(dataArr, poly);

  // Tüm kod kelimeleri
  const allCodewords = new Uint8Array(dataBytes + ecBytes);
  allCodewords.set(dataArr);
  allCodewords.set(ec, dataBytes);

  // Matris hazırlığı
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  };

  // 1. Finder Desenleri (7x7)
  const addFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          setModule(row, col, false);
        } else if (r === 0 || r === 6 || c === 0 || c === 6) {
          setModule(row, col, true);
        } else if (r === 1 || r === 5 || c === 1 || c === 5) {
          setModule(row, col, false);
        } else {
          setModule(row, col, true);
        }
      }
    }
  };
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 2. Alignment Deseni (5x5)
  if (spec.alignment.length === 2) {
    const ar = spec.alignment[1];
    const ac = spec.alignment[1];
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const val = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        setModule(ar + r, ac + c, val);
      }
    }
  }

  // 3. Timing Desenleri
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark Module
  setModule(size - 8, 8, true);

  // 5. Format Bilgisi Alanı (rezerve)
  for (let i = 0; i < 9; i++) {
    if (i !== 6) isFunction[8][i] = true;
    if (i !== 6) isFunction[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 6. Veri Modüllerini Yerleştir
  let bitIndex = 0;
  const totalBits = allCodewords.length * 8;
  let upwards = true;

  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Timing kolonunu atla
    for (let rStep = 0; rStep < size; rStep++) {
      const r = upwards ? size - 1 - rStep : rStep;
      for (let col = c; col >= c - 1; col--) {
        if (!isFunction[r][col]) {
          let bit = false;
          if (bitIndex < totalBits) {
            const bytePos = Math.floor(bitIndex / 8);
            const bitPos = 7 - (bitIndex % 8);
            bit = ((allCodewords[bytePos] >> bitPos) & 1) === 1;
            bitIndex++;
          }
          // Maske 0 uygula: (row + col) % 2 === 0
          const mask = (r + col) % 2 === 0;
          matrix[r][col] = mask ? !bit : bit;
        }
      }
    }
    upwards = !upwards;
  }

  // 7. Format Bilgisi Yaz (Mask 0, Error Correction L = 01 -> 111011111000100)
  const formatBits = 0b111011111000100;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    // Sol üst
    if (i < 6) matrix[8][i] = bit;
    else if (i < 8) matrix[8][i + 1] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Sağ üst ve sol alt
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

/**
 * QR Kodunu temiz, ölçeklenebilir ve estetik bir SVG dizesi olarak döndürür.
 */
export function generateQrSvg(text: string, size = 220): string {
  const matrix = generateQrMatrix(text);
  const n = matrix.length;
  const margin = 2;
  const totalSize = n + margin * 2;

  let paths = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        paths += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${totalSize}" height="${totalSize}" fill="#ffffff" rx="${margin}"/>
    <path d="${paths}" fill="#0F2040"/>
  </svg>`;
}
