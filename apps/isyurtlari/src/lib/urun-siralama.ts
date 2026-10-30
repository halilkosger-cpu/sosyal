/**
 * Varsayılan ürün sıralaması: önce satın alınabilir olanlar.
 *
 *   0 - Stokta ve fiyatı var: hemen alınabilir
 *   1 - Fiyatı var, stokta yok: ön talep verilebilir
 *   2 - Fiyatı girilmemiş: ziyaretçi için yapılacak bir şey yok
 *
 * Katalogda ürünlerin çoğu stokta değil; yalnızca eklenme tarihine göre
 * sıralanınca satın alınabilir birkaç ürün listenin içinde kayboluyordu.
 * Ana sayfa, kategori sayfası ve /api/urunler aynı kuralı buradan alıyor -
 * ayrı yazılsalardı sayfa ilk açılışta bir sıra gösterip sonra kendini
 * yeniden dizerdi.
 *
 * Yalnızca VARSAYILAN sıralamada kullanılıyor; müşterinin kendi seçtiği
 * fiyat/isim/yeni sıralamalarına dokunulmuyor.
 */
export function satilabilirlikKademesi(u: { price: number; quantity: number }): number {
  if (!(u.price > 0)) return 2;
  return u.quantity > 0 ? 0 : 1;
}

/** Ürün kimliği -> iptal edilmemiş ön talep sayısı (bkz. lib/on-talep-sayilari.ts). */
export type OnTalepSayilari = ReadonlyMap<string, number>;

type Siralanabilir = { id: string; price: number; quantity: number; createdAt: Date };

/**
 * Kademe, sonra ön talep sayısı (çok istenen üstte), sonra en yeni.
 * Talep kademenin önüne geçmiyor: fiyatsız bir ürün ne kadar istenirse
 * istensin sepete eklenemediği için listenin başına çıkmamalı.
 */
export function varsayilanKarsilastir(a: Siralanabilir, b: Siralanabilir, talepler: OnTalepSayilari): number {
  return (
    satilabilirlikKademesi(a) - satilabilirlikKademesi(b) ||
    (talepler.get(b.id) ?? 0) - (talepler.get(a.id) ?? 0) ||
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}

/** Diziyi yerinde değil, kopyasını sıralar. */
export function varsayilanSirala<T extends Siralanabilir>(urunler: T[], talepler: OnTalepSayilari): T[] {
  return [...urunler].sort((a, b) => varsayilanKarsilastir(a, b, talepler));
}
