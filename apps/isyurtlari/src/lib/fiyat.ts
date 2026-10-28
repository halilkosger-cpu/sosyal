/**
 * Siparis tutari hesabi.
 *
 * ─── ONEMLI: URUN FIYATLARI KDV DAHILDIR ───────────────────────────────
 *
 * Product.price alanindaki tutar musteriye gosterilen, KDV dahil nihai
 * fiyattir. KDV bu tutarin USTUNE eklenmez; ICINDEN hesaplanip yalnizca
 * kirilim olarak gosterilir ve siparise yazilir.
 *
 * Onceden boyle degildi: bu dosya tum urunlere odeme adiminda sabit %10
 * ekliyordu. Yani kartta 100 TL goren musteri odeme sayfasinda 110 TL ile
 * karsilasiyordu. Bu hem sitenin kendi metinleriyle celisiyordu (ana
 * sayfadaki aciklama ve sikca sorulan sorular "fiyatlar KDV dahildir"
 * diyor, urun sayfasi da oyle), hem de tuketiciye gosterilen fiyatin KDV
 * dahil olmasi gerektigi kuralina aykiriydi. Artik gosterilen tutar ile
 * tahsil edilen tutar ayni.
 *
 * KDV orani kategoride tutuluyor (ProductCategory.kdvOrani). Oran girilmemis
 * kategoriler icin VARSAYILAN_KDV_ORANI kullaniliyor. Oranlarin ürün grubuna
 * gore dogru girilmesi mali musavir teyidi isteyen bir konudur; kod tek bir
 * oran varsaymiyor, kategoriden okuyor.
 *
 * ─── KARGO ─────────────────────────────────────────────────────────────
 *
 * Gonderiler karsi odemeli: kargo bedeli siparis tutarina KATILMIYOR,
 * teslimatta dogrudan kargo firmasina odeniyor. Bu yuzden kargo hesabi
 * simdilik her zaman 0 donuyor. Ilerde sabit ucret + ucretsiz kargo esigi
 * modeline gecilirse yalnizca asagidaki uc sabit degistirilecek; cagiran
 * hicbir yerin degismesi gerekmiyor.
 */

/** Kategoride oran tanimli degilse kullanilan KDV orani (yuzde). */
export const VARSAYILAN_KDV_ORANI = 10;

/** Kargo karsi odemeli mi? true iken kargo bedeli siparise eklenmez. */
export const KARGO_KARSI_ODEMELI = true;

/** Karsi odemeli degilken uygulanacak sabit kargo bedeli (TL). */
export const KARGO_UCRETI = 0;

/** Bu tutar ve uzeri siparislerde kargo ucretsiz (1500 TL). */
export const UCRETSIZ_KARGO_ESIGI = 1500;

/**
 * Büyük Açılış & Efsane Kasım Kampanyası:
 * Tüm ürünlerde sepette net %10 otomatik indirim.
 */
export const KASIM_KAMPANYASI_BITIS = new Date('2026-12-01T00:00:00+03:00');
export const KASIM_KAMPANYASI_AKTIF = Date.now() < KASIM_KAMPANYASI_BITIS.getTime();
export const KASIM_INDIRIM_ORANI = 10; // %10

const yuvarla = (n: number) => Math.round(n * 100) / 100;

export interface FiyatKalemi {
  /** KDV dahil satir tutari: birim fiyat x adet, kampanya indirimi uygulanmis. */
  tutar: number;
  /** Kategorinin KDV orani (yuzde). Verilmezse varsayilan kullanilir. */
  kdvOrani?: number | null;
}

export interface SiparisTutari {
  /** İndirimsiz ham ürün toplamı. */
  hamUrunToplami: number;
  /** Kasım kampanyası indirim tutarı (%10). */
  kasimIndirimi: number;
  /** KDV dahil indirimli urun toplami. */
  urunToplami: number;
  /** urunToplami ICINDEKI KDV. Toplama ayrica eklenmez. */
  kdv: number;
  /** urunToplami - kdv. Fatura kirilimi icin. */
  kdvHaric: number;
  /** Siparise eklenen kargo bedeli. Karsi odemeli iken 0. */
  kargo: number;
  /** Musteriden tahsil edilecek tutar: urunToplami + kargo. */
  toplam: number;
}

/** KDV dahil bir tutarin icindeki KDV. */
export function icindekiKdv(kdvDahilTutar: number, oran?: number | null): number {
  const gecerliOran = typeof oran === 'number' && oran > 0 ? oran : VARSAYILAN_KDV_ORANI;
  if (!(gecerliOran > 0)) return 0;
  return yuvarla(kdvDahilTutar - kdvDahilTutar / (1 + gecerliOran / 100));
}

/** Urun toplamina gore kargo bedeli. */
export function kargoBedeli(urunToplami: number): number {
  if (KARGO_KARSI_ODEMELI) return 0;
  if (UCRETSIZ_KARGO_ESIGI > 0 && urunToplami >= UCRETSIZ_KARGO_ESIGI) return 0;
  return KARGO_UCRETI;
}

/**
 * Siparis tutarini kalemlerden uretir.
 *
 * Ayni hesap hem sepet ve odeme sayfasinda hem siparis ucunda kullaniliyor;
 * boylece musteriye gosterilen tutar ile siparise yazilan tutar tek kaynaktan
 * geliyor. KDV her kalem icin kendi kategori oraniyla hesaplanip toplaniyor:
 * kategorilere farkli oranlar girildiginde de dogru sonuc verir.
 */
export function siparisToplami(kalemler: FiyatKalemi[], kampanyaIndirimiUygula = KASIM_KAMPANYASI_AKTIF): SiparisTutari {
  const hamUrunToplami = yuvarla(kalemler.reduce((t, k) => t + k.tutar, 0));
  const kasimIndirimi = kampanyaIndirimiUygula ? yuvarla(hamUrunToplami * (KASIM_INDIRIM_ORANI / 100)) : 0;
  const urunToplami = yuvarla(hamUrunToplami - kasimIndirimi);

  const carpan = hamUrunToplami > 0 ? urunToplami / hamUrunToplami : 1;
  const kdv = yuvarla(kalemler.reduce((t, k) => t + icindekiKdv(k.tutar * carpan, k.kdvOrani), 0));
  const kargo = kargoBedeli(urunToplami);

  return {
    hamUrunToplami,
    kasimIndirimi,
    urunToplami,
    kdv,
    kdvHaric: yuvarla(urunToplami - kdv),
    kargo,
    toplam: yuvarla(urunToplami + kargo),
  };
}
