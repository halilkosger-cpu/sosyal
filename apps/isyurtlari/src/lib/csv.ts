/**
 * Basit CSV okuma/yazma. Excel ile calisacak sekilde tasarlandi:
 *
 * - Ayrac hem ';' (Turkce Excel varsayilani) hem ',' olabilir; otomatik secilir.
 * - Ondalik ayraci hem ',' (349,90) hem '.' (349.90) kabul edilir.
 * - Disari yazarken UTF-8 BOM ekleniyor, aksi halde Excel Turkce karakterleri
 *   bozuk gosteriyor.
 * - Eslestirme 'slug' uzerinden yapiliyor: slug ASCII, yani Excel kaydederken
 *   kod sayfasini degistirse bile bozulmaz. Urun adi yalnizca insan icin.
 */

// U+FEFF. Not: fetch().text() baslangictaki BOM'u standart geregi kirpar,
// bu yuzden testte BOM'u ham baytlardan (arrayBuffer) dogrulamak gerekir.
export const UTF8_BOM = '﻿';

/** Bir CSV metnini satir/sutun dizisine cevirir. Tirnakli alanlari destekler. */
export function csvAyristir(metin: string): string[][] {
  let s = metin.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Ayraci ilk satirdaki sayilara gore sec
  const ilkSatir = s.split('\n')[0] ?? '';
  const noktaliVirgul = (ilkSatir.match(/;/g) || []).length;
  const virgul = (ilkSatir.match(/,/g) || []).length;
  const ayrac = noktaliVirgul >= virgul ? ';' : ',';

  const satirlar: string[][] = [];
  let alan = '';
  let satir: string[] = [];
  let tirnakta = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];

    if (tirnakta) {
      if (c === '"') {
        if (s[i + 1] === '"') { alan += '"'; i++; }
        else tirnakta = false;
      } else alan += c;
      continue;
    }

    if (c === '"') { tirnakta = true; continue; }
    if (c === ayrac) { satir.push(alan); alan = ''; continue; }
    if (c === '\n') { satir.push(alan); satirlar.push(satir); satir = []; alan = ''; continue; }
    alan += c;
  }
  if (alan.length > 0 || satir.length > 0) { satir.push(alan); satirlar.push(satir); }

  return satirlar.filter((r) => r.some((h) => h.trim() !== ''));
}

/** Satirlari CSV metnine cevirir (';' ayracli, BOM'lu). */
export function csvOlustur(satirlar: (string | number)[][]): string {
  const kacir = (d: string | number) => {
    const s = String(d ?? '');
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return UTF8_BOM + satirlar.map((r) => r.map(kacir).join(';')).join('\r\n') + '\r\n';
}

/**
 * "349,90" / "349.90" / "1.234,50" / "₺349,90" gibi yazimlari sayiya cevirir.
 * Cevrilemezse null doner (bos hucre ile hatali hucreyi ayirt edebilmek icin
 * cagiran taraf bos kontrolunu ayrica yapmali).
 */
export function fiyatiCoz(ham: string): number | null {
  let s = String(ham ?? '').trim();
  if (s === '') return null;

  s = s.replace(/[₺\s]/g, '');

  const sonVirgul = s.lastIndexOf(',');
  const sonNokta = s.lastIndexOf('.');

  if (sonVirgul > -1 && sonNokta > -1) {
    // Ikisi de varsa sondaki ondalik ayracidir, digeri binlik
    if (sonVirgul > sonNokta) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (sonVirgul > -1) {
    // Yalniz virgul: son parca 1-2 haneli ise ondalik, degilse binlik ayraci
    const parca = s.slice(sonVirgul + 1);
    s = parca.length <= 2 ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (sonNokta > -1) {
    // Yalniz nokta: "1.500" Turkce'de 1500, Ingilizce'de 1.5 olabilir.
    // Fiyatlarda 3 ondalik hane kullanilmadigi icin, ayractan sonra tam 3 hane
    // varsa binlik ayraci kabul ediyoruz. Yanlis okuma 1000 kat fiyat hatasi
    // demek oldugundan bu ayrim onemli; kullanici zaten onizlemede goruyor.
    const parca = s.slice(sonNokta + 1);
    if (parca.length === 3) s = s.replace(/\./g, '');
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}
