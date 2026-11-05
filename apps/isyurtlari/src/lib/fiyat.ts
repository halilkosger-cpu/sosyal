/**
 * Siparis tutari hesabi.
 *
 * ─── ONEMLI: URUN FIYATLARI KDV DAHILDIR ───────────────────────────────
 *
 * Product.price alanindaki tutar musteriye gosterilen, KDV dahil nihai
 * fiyattir. KDV bu tutarin USTUNE eklenmez; ICINDEN hesaplanip yalnizca
 * kirilim olarak gosterilir ve siparise yazilir.
 *
 * KDV orani kategoride tutuluyor (ProductCategory.kdvOrani). Oran girilmemis
 * kategoriler icin VARSAYILAN_KDV_ORANI kullaniliyor.
 *
 * ─── KARGO ─────────────────────────────────────────────────────────────
 *
 * Kargo sabit ve tek tutar: KARGO_UCRETI (179 TL). Siparis toplamina eklenir
 * ve odeme adiminda "Kargo" satirinda gosterilir. Ucretsiz kargo esigi yoktur.
 *
 * ─── KASIM INDIRIMI ────────────────────────────────────────────────────
 *
 * Kaldirildi. Sepette ek yuzde indirim uygulanmaz.
 */

/** Kategoride oran tanimli degilse kullanilan KDV orani (yuzde). */
export const VARSAYILAN_KDV_ORANI = 10;

/** Sabit kargo bedeli (TL). Siparis toplamina eklenir. */
export const KARGO_UCRETI = 179;

const yuvarla = (n: number) => Math.round(n * 100) / 100;

export interface FiyatKalemi {
  /** KDV dahil satir tutari: birim fiyat x adet, varsa urun kampanyasi uygulanmis. */
  tutar: number;
  /** Kategorinin KDV orani (yuzde). Verilmezse varsayilan kullanilir. */
  kdvOrani?: number | null;
}

export interface SiparisTutari {
  /** KDV dahil urun toplami. */
  urunToplami: number;
  /** urunToplami ICINDEKI KDV. Toplama ayrica eklenmez. */
  kdv: number;
  /** urunToplami - kdv. Fatura kirilimi icin. */
  kdvHaric: number;
  /** Siparise eklenen sabit kargo bedeli. */
  kargo: number;
  /** Musteriden tahsil edilecek tutar: urunToplami + kargo. */
  toplam: number;
}

/**
 * Urunun fatura / on muhasebede kullanilacak KDV orani.
 *
 * Tek kaynak kategori (gida %1, diger gruplar %20). Siparis fiyatlamasi da
 * ayni orani kullandigi icin fatura ile checkout ayri oranlara dusmuyor.
 * Urun bazli vatRate yalnizca kategorisi bilinmeyen urunler icin yedek.
 */
export function urunKdvOrani(
  urun?: { vatRate?: number | null; category?: { kdvOrani?: number | null } | null } | null
): number {
  const kategoriOrani = urun?.category?.kdvOrani;
  if (typeof kategoriOrani === 'number' && kategoriOrani > 0) return kategoriOrani;
  const urunOrani = urun?.vatRate;
  if (typeof urunOrani === 'number' && urunOrani > 0) return urunOrani;
  return 20;
}

/**
 * Fatura satirinda gosterilen KDV HARIC birim fiyat.
 *
 * Satirlarda birimFiyat KDV dahil saklaniyor; faturada birim fiyat KDV haric
 * olmali. Satir toplami ve KDV tutarindan turetildigi icin her zaman toplamla
 * tutarli (ornek: 420 TL, %1 -> 415,84 + 4,16 KDV).
 */
export function birimFiyatKdvHaric(satir: { satirToplam: number; kdvTutari: number; miktar: number }): number {
  const adet = satir.miktar > 0 ? satir.miktar : 1;
  return yuvarla((satir.satirToplam - satir.kdvTutari) / adet);
}

/** KDV dahil bir tutarin icindeki KDV. */
export function icindekiKdv(kdvDahilTutar: number, oran?: number | null): number {
  const gecerliOran = typeof oran === 'number' && oran > 0 ? oran : VARSAYILAN_KDV_ORANI;
  if (!(gecerliOran > 0)) return 0;
  return yuvarla(kdvDahilTutar - kdvDahilTutar / (1 + gecerliOran / 100));
}

/**
 * Siparis tutarini kalemlerden uretir.
 *
 * Ayni hesap hem sepet ve odeme sayfasinda hem siparis ucunda kullaniliyor;
 * boylece musteriye gosterilen tutar ile siparise yazilan tutar tek kaynaktan
 * geliyor. KDV her kalem icin kendi kategori oraniyla hesaplanip toplaniyor.
 */
export function siparisToplami(kalemler: FiyatKalemi[]): SiparisTutari {
  const urunToplami = yuvarla(kalemler.reduce((t, k) => t + k.tutar, 0));
  const kdv = yuvarla(kalemler.reduce((t, k) => t + icindekiKdv(k.tutar, k.kdvOrani), 0));
  const kargo = urunToplami > 0 ? KARGO_UCRETI : 0;

  return {
    urunToplami,
    kdv,
    kdvHaric: yuvarla(urunToplami - kdv),
    kargo,
    toplam: yuvarla(urunToplami + kargo),
  };
}
