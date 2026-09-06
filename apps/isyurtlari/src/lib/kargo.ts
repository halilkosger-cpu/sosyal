/**
 * Kargo firmaları ve sipariş durumu akışı.
 *
 * Bu dosya hem sunucu hem istemci tarafından import ediliyor; içinde
 * veritabanına ya da sunucuya özgü hiçbir şey bulunmamalı.
 */

export interface KargoFirmasi {
  /** Veritabanında saklanan kod. */
  kod: string;
  ad: string;
  /** Firmanın gönderi sorgulama sayfası. */
  takipSayfasi: string;
}

/**
 * ─── NEDEN DOĞRUDAN TAKİP BAĞLANTISI ÜRETMİYORUZ ──────────────────────
 *
 * Takip numarasını adrese gömen bir bağlantı ("...?code=12345") kulağa
 * daha kullanışlı geliyor, ama her firmanın parametre adı farklı ve bu
 * adresler zaman zaman değişiyor. Yanlış bir parametre müşteriyi firmanın
 * hata sayfasına düşürür - takip numarasını kendisi yapıştırmasından daha
 * kötü bir sonuç.
 *
 * Bu yüzden: firmanın sorgulama sayfasına bağlantı + numarayı tek tıkla
 * kopyalama. Bir firmanın doğrudan bağlantı biçimi doğrulandığında buraya
 * eklenebilir; o zamana kadar çalışmayan bir bağlantı vermiyoruz.
 */
export const KARGO_FIRMALARI: KargoFirmasi[] = [
  { kod: 'ptt', ad: 'PTT Kargo', takipSayfasi: 'https://gonderitakip.ptt.gov.tr' },
  {
    kod: 'yurtici',
    ad: 'Yurtiçi Kargo',
    takipSayfasi: 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula',
  },
  { kod: 'aras', ad: 'Aras Kargo', takipSayfasi: 'https://kargotakip.araskargo.com.tr' },
  { kod: 'mng', ad: 'MNG Kargo', takipSayfasi: 'https://kargotakip.dhlecommerce.com.tr' },
  { kod: 'surat', ad: 'Sürat Kargo', takipSayfasi: 'https://www.suratkargo.com.tr/KargoTakip' },
  { kod: 'ups', ad: 'UPS Kargo', takipSayfasi: 'https://www.ups.com/track?loc=tr_TR' },
  { kod: 'trendyol', ad: 'Trendyol Express', takipSayfasi: 'https://kargotakip.trendyol.com' },
  { kod: 'diger', ad: 'Diğer', takipSayfasi: '' },
];

const HARITA = new Map(KARGO_FIRMALARI.map((f) => [f.kod, f]));

export function kargoFirmasi(kod: string | null | undefined): KargoFirmasi | null {
  if (!kod) return null;
  return HARITA.get(kod) ?? null;
}

/** Kayıtlı olmayan bir kod gelirse kodun kendisi gösterilsin, boşluk değil. */
export function kargoFirmaAdi(kod: string | null | undefined): string | null {
  if (!kod) return null;
  return HARITA.get(kod)?.ad ?? kod;
}

// ─── Sipariş durumu ───────────────────────────────────────────────────

export type SiparisDurumu = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const SIPARIS_DURUM_METNI: Record<SiparisDurumu, string> = {
  PENDING: 'Sipariş alındı',
  CONFIRMED: 'Hazırlanıyor',
  SHIPPED: 'Kargoya verildi',
  DELIVERED: 'Teslim edildi',
  CANCELLED: 'İptal edildi',
};

/**
 * Müşteriye gösterilen açıklamalar.
 *
 * "Sipariş alındı" durumunda ödeme beklendiği yazılmıyor: kargo karşı
 * ödemeli, müşteri site üzerinden bir şey ödemiyor. Sipariş uçlarında
 * PENDING "yeni sipariş" anlamında kullanılıyor.
 */
export const SIPARIS_DURUM_ACIKLAMASI: Record<SiparisDurumu, string> = {
  PENDING: 'Siparişiniz bize ulaştı, en kısa sürede hazırlanacak.',
  CONFIRMED: 'Siparişiniz hazırlanıyor.',
  SHIPPED: 'Siparişiniz kargoya verildi. Ödeme teslimat sırasında kargo firmasına yapılır.',
  DELIVERED: 'Siparişiniz teslim edildi.',
  CANCELLED: 'Siparişiniz iptal edildi.',
};

/** İlerleme çubuğunun adımları. İptal bu akışın dışında. */
export const SIPARIS_AKISI: SiparisDurumu[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

/** Akıştaki sıra numarası; iptal edilmiş siparişte -1. */
export function durumAdimi(durum: string): number {
  return SIPARIS_AKISI.indexOf(durum as SiparisDurumu);
}

export const IPTAL_EDILDI = (durum: string) => durum === 'CANCELLED';
