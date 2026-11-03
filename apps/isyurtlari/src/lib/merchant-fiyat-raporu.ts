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

interface MerchantFiyat {
  amountMicros?: string;
  currencyCode?: string;
}

interface MerchantYanit {
  results?: {
    priceCompetitivenessProductView?: {
      id?: string;
      title?: string;
      price?: MerchantFiyat;
      benchmarkPrice?: MerchantFiyat;
    };
  }[];
}

const mikroTl = (m: string | undefined) => (m ? Number(m) / 1_000_000 : 0);

export function merchantSatirlariniAyristir(yanit: MerchantYanit): MerchantSatir[] {
  return (yanit.results ?? []).map((r) => {
    const v = r.priceCompetitivenessProductView;
    const benchmarkMikro = v?.benchmarkPrice?.amountMicros;
    return {
      id: v?.id ?? '',
      baslik: v?.title ?? '',
      fiyat: mikroTl(v?.price?.amountMicros),
      benchmark: benchmarkMikro ? mikroTl(benchmarkMikro) : null,
      paraBirimi: v?.price?.currencyCode ?? 'TRY',
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
    veriYok: satirlar.length === 0,
  };
}

/** Merchant API v1'den fiyat rekabeti satırlarını çeker. */
export async function merchantSatirlariGetir(): Promise<MerchantSatir[]> {
  const jeton = await googleErisimJetonu(['https://www.googleapis.com/auth/content']);

  // Bu görünümde yalnızca tek tablo sorgulanabilir; ürün alanları da aynı tablodan gelir.
  // id ve report_country_code SELECT içinde zorunlu.
  const sorgu = `
    SELECT
      id,
      title,
      price,
      benchmark_price,
      report_country_code
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
