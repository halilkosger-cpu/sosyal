/**
 * Google Analytics 4 e-ticaret olaylari.
 *
 * Site bugune kadar yalnizca sayfa goruntuleme gonderiyordu; GA'nin e-ticaret
 * raporlari (gelir, islem sayisi, donusum orani, en cok satan urun) bu yuzden
 * bostu. Burada GA4'un bekledigi dort olay uretiliyor:
 *   view_item -> add_to_cart -> begin_checkout -> purchase
 *
 * Olaylar yalnizca tarayicida calisir. Cerez onayi reddedilmisse gtag
 * `analytics_storage: denied` ile calistigi icin olaylar toplanmaz - burada
 * ayrica engellemeye gerek yok, onay yonetimi tek yerde (Olcumler) kalsin.
 *
 * Admin panelinde gtag hic yuklenmiyor; oradaki cagrilar sessizce kuyruga
 * yazilir ve islenmez.
 */

const PARA_BIRIMI = 'TRY';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export interface AnalizKalemi {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

/**
 * gtag betigi lazyOnload ile yuklendigi icin ilk olaylar o yuklenmeden once
 * tetiklenebiliyor. Resmi gtag kaliyla bir kuyruk kuruyoruz: betik yuklenince
 * dataLayer'daki birikmis olaylari kendisi isliyor.
 */
function kuyrugaYaz(...arg: unknown[]) {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag === 'function') {
    window.gtag(...arg);
    return;
  }

  window.dataLayer.push(arg);
}

function olayGonder(ad: string, veri: Record<string, unknown>) {
  kuyrugaYaz('event', ad, { currency: PARA_BIRIMI, ...veri });
}

const toplam = (kalemler: AnalizKalemi[]) =>
  Math.round(kalemler.reduce((t, k) => t + k.price * k.quantity, 0) * 100) / 100;

/** Urun detay sayfasi goruntulendi. */
export function urunGoruntulendi(kalem: AnalizKalemi) {
  olayGonder('view_item', { value: toplam([kalem]), items: [kalem] });
}

/** Urun sepete eklendi. */
export function sepeteEklendi(kalem: AnalizKalemi) {
  olayGonder('add_to_cart', { value: toplam([kalem]), items: [kalem] });
}

/** Urun sepetten cikarildi. */
export function sepettenCikarildi(kalem: AnalizKalemi) {
  olayGonder('remove_from_cart', { value: toplam([kalem]), items: [kalem] });
}

/** Odeme adimina gecildi. */
export function odemeyeBaslandi(kalemler: AnalizKalemi[]) {
  if (kalemler.length === 0) return;
  olayGonder('begin_checkout', { value: toplam(kalemler), items: kalemler });
}

/**
 * Siparis tamamlandi.
 *
 * Ayni siparis icin yalnizca bir kez gonderilir. Musteri onay sayfasini
 * yenilerse veya bagi tekrar acarsa olay tekrar tetiklenir ve GA'da ciro iki
 * kat gorunurdu; bu veri sonradan duzeltilemiyor. Isaret sessionStorage'da
 * siparis numarasina bagli tutuluyor.
 */
export function siparisTamamlandi(siparis: {
  siparisNo: string;
  tutar: number;
  kalemler: AnalizKalemi[];
}) {
  if (typeof window === 'undefined') return;

  const anahtar = `ga4_purchase_${siparis.siparisNo}`;
  try {
    if (sessionStorage.getItem(anahtar)) return;
    sessionStorage.setItem(anahtar, '1');
  } catch {
    // sessionStorage kapaliysa tekrari engelleyemeyiz; olayi yine de
    // gondermek, hic gondermemekten iyi.
  }

  olayGonder('purchase', {
    transaction_id: siparis.siparisNo,
    value: siparis.tutar,
    items: siparis.kalemler,
  });
}
