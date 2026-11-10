/**
 * Google Merchant feed'i icin urun ozellikleri (product_detail).
 *
 * Aroma: urun adindan cikarilir (yalnizca recel urunleri).
 * Seker icerigi: SADECE etiketten dogrulanmis degerler girilir; tahmin yok.
 */

const AROMALAR: Array<[RegExp, string]> = [
  [/gül/i, 'Gül'],
  [/çilek/i, 'Çilek'],
  [/incir/i, 'İncir'],
  [/karadut/i, 'Karadut'],
  [/vişne/i, 'Vişne'],
  [/kızılcık/i, 'Kızılcık'],
  [/böğürtlen/i, 'Böğürtlen'],
  [/biber/i, 'Tatlı Biber'],
];

/** Etiketten dogrulanmis seker degerleri (100 g basina). Slug -> deger. */
export const SEKER_ICERIGI: Record<string, string> = {
  'cilek-receli': '62 g / 100 g',
  'elban-tam-yagli-kasar-peyniri-500-gr': '1 g / 100 g',
  // Etiketteki 19,1 g hatali (karbonhidrattan buyuk); 0,30 g degeri urun sahibi tarafindan belirlendi.
  'siyah-zeytin': '0,3 g / 100 g',
  // Bal: etikette sekerler satiri yok; 77 g degeri urun sahibi tarafindan belirlendi.
  'bal-ari-urunleri': '77 g / 100 g',
};

export interface UrunOzelligi {
  bolum: string;
  ad: string;
  deger: string;
}

export function aromaBul(baslik: string): string | null {
  // Bal: etikette 'CICEK BALI' yaziyor.
  if (/çiçek balı/i.test(baslik)) return 'Çiçek';
  if (!/reçel/i.test(baslik)) return null;
  // Karisik paketlerde tek aroma yok.
  if (/karışık|\d'lü/i.test(baslik)) return null;
  return AROMALAR.find(([desen]) => desen.test(baslik))?.[1] ?? null;
}

export function urunOzellikleri(baslik: string, slug: string): UrunOzelligi[] {
  const sonuc: UrunOzelligi[] = [];
  const aroma = aromaBul(baslik);
  if (aroma) sonuc.push({ bolum: 'Ürün Özellikleri', ad: 'Aroma', deger: aroma });
  const seker = SEKER_ICERIGI[slug];
  if (seker) sonuc.push({ bolum: 'Besin Değerleri', ad: 'Şeker İçeriği', deger: seker });
  return sonuc;
}
