/**
 * Kupon hesapları - saf fonksiyonlar.
 *
 * Bu dosya BİLEREK veritabanından bağımsız: ödeme sayfası (istemci) de
 * aynı hesabı yapıyor. lib/kupon.ts prisma import ettiği için ondan
 * import etmek, Prisma'yı tarayıcı paketine sokardı.
 *
 * Doğrulama (kupon var mı, süresi dolmuş mu, hakkı kalmış mı) sunucuda:
 * bkz. lib/kupon.ts.
 */

const yuvarla = (n: number) => Math.round(n * 100) / 100;

/** Kod her yerde aynı biçimde: büyük harf, boşluksuz. */
export function kuponKodunuNormalize(kod: unknown): string {
  return String(kod ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .slice(0, 40);
}

/**
 * İndirim tutarı.
 *
 * İki sınır var: indirim sepet toplamını AŞAMAZ (aksi halde tutar eksiye
 * düşerdi) ve yüzde kuponlarda azamiIndirim varsa onu aşamaz.
 */
export function kuponIndirimi(
  kupon: { tur: string; deger: number; azamiIndirim: number | null },
  urunToplami: number
): number {
  if (!(urunToplami > 0) || !(kupon.deger > 0)) return 0;

  let indirim =
    kupon.tur === 'YUZDE' ? (urunToplami * kupon.deger) / 100 : kupon.deger;

  if (kupon.tur === 'YUZDE' && typeof kupon.azamiIndirim === 'number' && kupon.azamiIndirim > 0) {
    indirim = Math.min(indirim, kupon.azamiIndirim);
  }

  return yuvarla(Math.min(indirim, urunToplami));
}

/**
 * İndirimi kalemlere orantılı dağıtır.
 *
 * ─── NEDEN GEREKLİ ────────────────────────────────────────────────────
 *
 * Fiyatlar KDV DAHİL ve KDV oranı kategoriye göre değişebiliyor. Kupon
 * tahsil edilen tutarı düşürdüğüne göre, o tutarın içindeki KDV de
 * düşmeli. İndirimi toplamdan düşüp KDV'yi indirimsiz tutar üzerinden
 * hesaplasaydık, siparişe gerçekte tahsil edilmeyen bir KDV yazılırdı -
 * fatura ve mutabakat yanlış olurdu.
 *
 * Dağıtım kalem tutarıyla orantılı; kuruş farkı son kaleme yazılıyor ki
 * dağıtılan toplam indirimle birebir eşitlensin.
 */
export function indirimiKalemlereDagit<T extends { tutar: number }>(
  kalemler: T[],
  indirim: number
): (T & { indirimliTutar: number })[] {
  const toplam = kalemler.reduce((t, k) => t + k.tutar, 0);
  if (!(indirim > 0) || !(toplam > 0)) {
    return kalemler.map((k) => ({ ...k, indirimliTutar: yuvarla(k.tutar) }));
  }

  const gercekIndirim = Math.min(indirim, toplam);
  let dagitilan = 0;

  return kalemler.map((k, sira) => {
    const sonuncu = sira === kalemler.length - 1;
    const pay = sonuncu
      ? yuvarla(gercekIndirim - dagitilan)
      : yuvarla((gercekIndirim * k.tutar) / toplam);
    dagitilan = yuvarla(dagitilan + pay);
    return { ...k, indirimliTutar: yuvarla(k.tutar - pay) };
  });
}
