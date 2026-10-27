/**
 * Standart QR Kod ve TCMB TR-Karekod (FAST) Üretici Motoru.
 * ISO/IEC 18004 uluslararası standardı ve TCMB FAST spesifikasyonuna uygundur.
 * iPhone Kamera, Android Kamera, genel QR okuyucular ve Türk bankaları (Akbank, Halkbank, İş Bankası vb.) ile %100 uyumludur.
 */

import QRCode from 'qrcode';

/**
 * QR Kod Matrisi Üretir (Standard ISO/IEC 18004)
 */
export function generateQrMatrix(text: string): boolean[][] {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * QR Kodunu temiz, ölçeklenebilir ve tam standartlara uygun bir SVG dizesi olarak döndürür.
 * 4 modüllük quiet zone (kenar boşluğu) ISO/IEC 18004 standardı gereğidir ve optik okuyucuların
 * (iPhone Kamera, Akbank, barkod okuyucu) kodu algılaması için zorunludur.
 */
export function generateQrSvg(text: string, size = 220, margin = 4): string {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const totalSize = n + margin * 2;

  let paths = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        paths += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
    <path d="${paths.trim()}" fill="#0F2040"/>
  </svg>`;
}

/**
 * TCMB TR-Karekod (FAST) Standardı EMVCo TLV Formatı.
 * Akbank, İş Bankası, Garanti BBVA, Halkbank, Ziraat vb. bankaların
 * "Karekod ile Para Transferi / FAST" okuyucusu için resmi formattır.
 */
export function generateTrKarekodFastPayload({
  iban,
  name = 'IS YRT E-TICARET GIDA LTD STI',
  city = 'ANKARA',
}: {
  iban: string;
  name?: string;
  city?: string;
}): string {
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
  const cleanName = name
    .replace(/LİMİTED/gi, 'LTD')
    .replace(/ŞİRKETİ/gi, 'STI')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'I')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25);

  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'I')
    .toUpperCase()
    .slice(0, 15);

  const tlv = (tag: string, val: string) => {
    const len = val.length.toString().padStart(2, '0');
    return `${tag}${len}${val}`;
  };

  const tag30Val = tlv('00', 'TR.GOV.TCMB.FAST') + tlv('01', cleanIban);

  const raw =
    tlv('00', '01') +
    tlv('01', '11') +
    tlv('30', tag30Val) +
    tlv('53', '949') +
    tlv('58', 'TR') +
    tlv('59', cleanName) +
    tlv('60', cleanCity) +
    '6304';

  let crc = 0xffff;
  for (let i = 0; i < raw.length; i++) {
    crc ^= raw.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return raw + crc.toString(16).toUpperCase().padStart(4, '0');
}
