/**
 * İade (cayma hakkı) kuralları.
 *
 * Alt bilgide "14 gün içinde cayma hakkı" yazıyor ve mesafeli satış
 * sözleşmesi bunu taahhüt ediyor. Süreyi hesaplayan tek yer burası olsun:
 * hem müşteri ekranı hem uç aynı fonksiyonu çağırıyor, aksi halde biri
 * değiştiğinde diğeri sessizce eski kuralda kalırdı.
 *
 * NOT: Buradaki kurallar mesafeli satış sözleşmenizin metnine göre
 * yazıldı. Hukuki metin değişirse burası da değişmeli; ben avukat değilim.
 */

/** Cayma hakkı süresi (gün). Teslim tarihinden itibaren. */
export const CAYMA_GUN = 14;

export const IADE_SEBEPLERI = [
  'Ürün beklediğim gibi değil',
  'Hasarlı / kusurlu geldi',
  'Yanlış ürün gönderildi',
  'Vazgeçtim',
  'Diğer',
] as const;

export type IadeSebebi = (typeof IADE_SEBEPLERI)[number];

export interface IadeUygunlugu {
  uygun: boolean;
  /** Kalan gün sayısı; süre dolduysa 0. */
  kalanGun: number;
  /** Uygun değilse müşteriye gösterilecek sebep. */
  sebep?: string;
}

/**
 * Siparişin iade edilebilir olup olmadığını söyler.
 *
 * Teslim edilmemiş sipariş iade edilmez: henüz elinde olmayan bir ürün
 * için cayma değil, sipariş iptali gerekir - o ayrı bir akış.
 */
export function iadeUygunlugu(siparis: {
  status: string;
  deliveredAt?: Date | string | null;
  createdAt: Date | string;
}): IadeUygunlugu {
  if (siparis.status === 'CANCELLED') {
    return { uygun: false, kalanGun: 0, sebep: 'İptal edilmiş siparişler iade edilemez.' };
  }

  if (siparis.status !== 'DELIVERED') {
    return {
      uygun: false,
      kalanGun: 0,
      sebep: 'İade talebi ancak sipariş teslim edildikten sonra oluşturulabilir.',
    };
  }

  /**
   * Teslim tarihi yoksa sipariş tarihinden sayılıyor.
   *
   * deliveredAt alanı bu akışla birlikte eklendi; ondan önce teslim
   * edilmiş siparişlerde boş. O kayıtlarda müşteriyi mağdur etmemek için
   * sipariş tarihi kullanılıyor - müşterinin lehine olan yorum.
   */
  const baslangic = new Date(siparis.deliveredAt ?? siparis.createdAt);
  const sonGun = new Date(baslangic.getTime() + CAYMA_GUN * 24 * 60 * 60 * 1000);
  const kalanMs = sonGun.getTime() - Date.now();

  if (kalanMs <= 0) {
    return {
      uygun: false,
      kalanGun: 0,
      sebep: `Cayma süresi (${CAYMA_GUN} gün) dolmuş. Ürün kusurluysa yine de bizimle iletişime geçin.`,
    };
  }

  return { uygun: true, kalanGun: Math.ceil(kalanMs / (24 * 60 * 60 * 1000)) };
}

export const IADE_DURUM_METNI: Record<string, string> = {
  TALEP: 'Talep alındı',
  ONAYLANDI: 'Onaylandı — ürün bekleniyor',
  REDDEDILDI: 'Reddedildi',
  URUN_ULASTI: 'Ürün ulaştı',
  TAMAMLANDI: 'Tamamlandı — ödeme iade edildi',
  IPTAL: 'İptal edildi',
};

/** Müşterinin kendi iptal edebileceği durumlar. */
export const MUSTERI_IPTAL_EDEBILIR = ['TALEP', 'ONAYLANDI'];
