import { googleErisimJetonu } from './google-erisim';
import type { TrafikOzeti, KanalOzeti } from './gunluk-rapor';

/**
 * GA4 Data API (runReport) ile kanal bazlı trafik özeti.
 *
 * Mülk kimliği GA4_PROPERTY_ID ortam değişkeninden okunur. Servis hesabının
 * GA4 mülkünde en az "Görüntüleyici" yetkisi olmalıdır.
 */

interface Ga4Satir {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

export interface Ga4Yanit {
  rows?: Ga4Satir[];
}

const sayi = (s: string | undefined) => Number(s ?? 0) || 0;

/** Ham GA4 yanıtını TrafikOzeti'ne çevirir. Oranlar GA4'te 0-1 aralığındadır. */
export function ga4YanitiniAyristir(yanit: Ga4Yanit): TrafikOzeti {
  const satirlar = yanit.rows ?? [];
  // Metrik sırası ga4TrafikGetir'deki istekle aynı: oturum, işlem, çıkış, dönüşüm.
  let toplamOturum = 0;
  let toplamIslem = 0;

  const kanallar: KanalOzeti[] = satirlar.map((s) => {
    const [oturum, islem, bounce, donusum] = (s.metricValues ?? []).map((m) => m.value);
    toplamOturum += sayi(oturum);
    toplamIslem += sayi(islem);
    return {
      kanal: s.dimensionValues?.[0]?.value ?? 'Bilinmeyen',
      oturum: sayi(oturum),
      donusumOrani: Math.round(sayi(donusum) * 10000) / 100,
      bounceRate: Math.round(sayi(bounce) * 10000) / 100,
    };
  });

  return {
    oturum: toplamOturum,
    donusumOrani: toplamOturum > 0 ? Math.round((toplamIslem / toplamOturum) * 10000) / 100 : 0,
    kanallar,
  };
}

/** Belirtilen gün için GA4 kanal raporunu çeker. */
export async function ga4TrafikGetir(tarih: string): Promise<TrafikOzeti> {
  const mulkId = process.env.GA4_PROPERTY_ID;
  if (!mulkId) throw new Error('GA4_PROPERTY_ID tanımlı değil');

  const jeton = await googleErisimJetonu(['https://www.googleapis.com/auth/analytics.readonly']);

  const yanit = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${mulkId}:runReport`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
    body: JSON.stringify({
      dateRanges: [{ startDate: tarih, endDate: tarih }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'transactions' },
        { name: 'bounceRate' },
        { name: 'sessionConversionRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
    cache: 'no-store',
  });

  if (!yanit.ok) {
    throw new Error(`GA4 runReport başarısız: ${yanit.status} ${await yanit.text()}`);
  }
  return ga4YanitiniAyristir((await yanit.json()) as Ga4Yanit);
}
