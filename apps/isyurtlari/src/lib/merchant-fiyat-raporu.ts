import { googleErisimJetonu } from './google-erisim';
import type { FiyatKalemi, FiyatOzeti } from './gunluk-rapor';

/**
 * Merchant API v1 (Reports) ile fiyat rekabeti verisi.
 *
 * Not: Content API for Shopping (v2.1) 18 Ağustos 2026'da kapatıldı. Eski
 * `shoppingcontent.googleapis.com` çağrısı artık çalışmaz; bu modül yalnızca
 * Merchant API v1'i kullanır. Yerel "simülasyon" fiyatları günlük rapora
 * girmez: canlı veri alınamazsa rapor bunu açıkça yazar.
 *
 * Doğrulanmamış nokta: v1 sorgusundaki alan adları ve yanıt şekli canlı
 * hesapta bir kez denenmeden kesin kabul edilmemeli.
 */

export const MERCHANT_HESAP_ID = process.env.GOOGLE_MERCHANT_ID || '5876808666';

const FIYAT_ESIGI_YUZDE = 10;

export interface MerchantSatir {
  id: string;
  baslik: string;
  fiyat: number;
  benchmark: number | null;
  paraBirimi: string;
}

interface MerchantYanit {
  results?: {
    productView?: {
      id?: string;
      title?: string;
      price?: { amountMicros?: string; currencyCode?: string };
    };
    priceCompetitivenessProductView?: {
      benchmarkPrice?: { amountMicros?: string; currencyCode?: string };
    };
  }[];
}

const mikroTl = (m: string | undefined) => (m ? Number(m) / 1_000_000 : 0);

export function merchantSatirlariniAyristir(yanit: MerchantYanit): MerchantSatir[] {
  return (yanit.results ?? []).map((r) => {
    const benchmarkMikro = r.priceCompetitivenessProductView?.benchmarkPrice?.amountMicros;
    return {
      id: r.productView?.id ?? '',
      baslik: r.productView?.title ?? '',
      fiyat: mikroTl(r.productView?.price?.amountMicros),
      benchmark: benchmarkMikro ? mikroTl(benchmarkMikro) : null,
      paraBirimi: r.productView?.price?.currencyCode ?? 'TRY',
    };
  });
}

/** Satırları %10 eşiğine göre pahalı, ucuz ve eksik olarak sınıflandırır. */
export function fiyatOzetiOlustur(satirlar: MerchantSatir[]): FiyatOzeti {
  const kalemler: (FiyatKalemi & { ham: number })[] = [];
  let eksik = 0;

  for (const s of satirlar) {
    if (!s.benchmark || s.fiyat <= 0) {
      eksik++;
      continue;
    }
    const fark = Math.round(((s.fiyat - s.benchmark) / s.benchmark) * 1000) / 10;
    kalemler.push({ baslik: s.baslik, fark, ham: fark });
  }

  const pahali = kalemler
    .filter((k) => k.ham > FIYAT_ESIGI_YUZDE)
    .sort((a, b) => b.ham - a.ham)
    .map(({ baslik, fark }) => ({ baslik, fark }));
  const ucuz = kalemler
    .filter((k) => k.ham < -FIYAT_ESIGI_YUZDE)
    .sort((a, b) => a.ham - b.ham)
    .map(({ baslik, fark }) => ({ baslik, fark }));

  return {
    pahali,
    ucuz,
    pahaliSayi: pahali.length,
    ucuzSayi: ucuz.length,
    eksikSayi: eksik,
    feedSorunu: eksik > 0 ? `${eksik} ürün için benchmark fiyatı yok` : null,
  };
}

/** Merchant API v1'den fiyat rekabeti satırlarını çeker. */
export async function merchantSatirlariGetir(): Promise<MerchantSatir[]> {
  const jeton = await googleErisimJetonu(['https://www.googleapis.com/auth/content']);

  const sorgu = `
    SELECT
      product_view.id,
      product_view.title,
      product_view.price.amount_micros,
      product_view.price.currency_code,
      price_competitiveness_product_view.benchmark_price.amount_micros,
      price_competitiveness_product_view.benchmark_price.currency_code
    FROM price_competitiveness_product_view
    LIMIT 200
  `;

  const yanit = await fetch(
    `https://merchantapi.googleapis.com/reports/v1/accounts/${MERCHANT_HESAP_ID}/reports:search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ query: sorgu }),
      cache: 'no-store',
    }
  );

  if (!yanit.ok) {
    throw new Error(`Merchant reports:search başarısız: ${yanit.status} ${await yanit.text()}`);
  }
  return merchantSatirlariniAyristir((await yanit.json()) as MerchantYanit);
}

/**
 * Geçici tanı: benchmark içermeyen basit bir Merchant raporu dener.
 * Bu basit sorgu başarılıysa kimlik doğrulama çalışıyor demektir; sorun
 * price_competitiveness_product_view raporunun hesapta kullanılamamasıdır.
 */
export async function merchantTaniGetir(): Promise<{ durum: number; yanit: string }> {
  const jeton = await googleErisimJetonu(['https://www.googleapis.com/auth/content']);
  const yanit = await fetch(
    `https://merchantapi.googleapis.com/reports/v1/accounts/${MERCHANT_HESAP_ID}/reports:search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ query: 'SELECT product_view.id, product_view.title FROM product_view LIMIT 1' }),
      cache: 'no-store',
    }
  );
  return { durum: yanit.status, yanit: (await yanit.text()).slice(0, 1500) };
}

/**
 * Geçici kurulum: GCP projesini Merchant hesabına API geliştiricisi olarak
 * kaydeder (developerRegistration:registerGcp). Bir kez çalıştırılır.
 */
export async function merchantProjeKaydet(): Promise<{ durum: number; yanit: string }> {
  const jeton = await googleErisimJetonu(['https://www.googleapis.com/auth/content']);
  const yanit = await fetch(
    `https://merchantapi.googleapis.com/accounts/v1/accounts/${MERCHANT_HESAP_ID}/developerRegistration:registerGcp`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ developerEmail: process.env.GUNLUK_RAPOR_ALICI || 'halil.kosger@gmail.com' }),
      cache: 'no-store',
    }
  );
  return { durum: yanit.status, yanit: (await yanit.text()).slice(0, 1500) };
}
