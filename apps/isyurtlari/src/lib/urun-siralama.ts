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

/** Kademe, sonra en yeni. Diziyi yerinde değil, kopyasını sıralar. */
export function varsayilanSirala<T extends { price: number; quantity: number; createdAt: Date }>(
  urunler: T[]
): T[] {
  return [...urunler].sort(
    (a, b) =>
      satilabilirlikKademesi(a) - satilabilirlikKademesi(b) ||
      b.createdAt.getTime() - a.createdAt.getTime()
  );
}
