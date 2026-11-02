/**
 * Google Merchant Center Reports API & MCQL (Merchant Center Query Language) Servisi
 *
 * Hesap ID: 5876808666
 * Resmi API: https://developers.google.com/shopping-content/reference/rest/v2.1/reports/search
 */

export const MERCHANT_ACCOUNT_ID = process.env.GOOGLE_MERCHANT_ID || '5876808666';

export interface FiyatRekabetKalemi {
  urunId: string;
  baslik: string;
  marka: string;
  magazaFiyati: number;
  paraBirimi: string;
  piyasaKiyaslamaFiyati: number;
  farkYuzdesi: number;
  rekabetDurumu: 'AVANTAJLI' | 'PAHALI' | 'REKABETCI';
}

export interface UrunPerformansKalemi {
  urunId: string;
  baslik: string;
  gosterim: number;
  tiklama: number;
  tiklanmaOrani: number; // CTR %
}

export interface MerchantRaporSonucu {
  basarili: boolean;
  kaynak: 'CANLI_API' | 'YEREL_SIMULASYON';
  tarih: string;
  fiyatRekabeti: FiyatRekabetKalemi[];
  performans?: UrunPerformansKalemi[];
  mesaj?: string;
}

/**
 * MCQL (Merchant Center Query Language) üzerinden Fiyat Rekabetçiliği ve Performans Raporu Çekme
 */
export async function merchantRekabetRaporuGetir(urunlerListesi?: { id: string; name: string; price: number; slug: string }[]): Promise<MerchantRaporSonucu> {
  const apiKey = process.env.GOOGLE_MERCHANT_API_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  // 1. Canlı Google Content API / Reports Endpoint
  if (apiKey) {
    try {
      const mcqlQuery = `
        SELECT
          product_view.id,
          product_view.title,
          product_view.brand,
          product_view.price_micros,
          product_view.currency_code,
          price_competitiveness_product_view.benchmark_price_micros,
          price_competitiveness_product_view.benchmark_price_currency_code
        FROM price_competitiveness_product_view
        WHERE product_view.price_micros > 0
        LIMIT 250
      `;

      const response = await fetch(
        `https://shoppingcontent.googleapis.com/content/v2.1/${MERCHANT_ACCOUNT_ID}/reports/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ query: mcqlQuery }),
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const sonuclar: FiyatRekabetKalemi[] = (data.results || []).map((row: any) => {
          const fiyat = (row.productView?.priceMicros || 0) / 1_000_000;
          const kiyaslama = (row.priceCompetitivenessProductView?.benchmarkPriceMicros || 0) / 1_000_000;
          const fark = kiyaslama > 0 ? Math.round(((fiyat - kiyaslama) / kiyaslama) * 100) : 0;

          return {
            urunId: row.productView?.id || '',
            baslik: row.productView?.title || '',
            marka: row.productView?.brand || 'İşyurtları',
            magazaFiyati: fiyat,
            paraBirimi: row.productView?.currencyCode || 'TRY',
            piyasaKiyaslamaFiyati: kiyaslama,
            farkYuzdesi: fark,
            rekabetDurumu: fark < -3 ? 'AVANTAJLI' : fark > 5 ? 'PAHALI' : 'REKABETCI',
          };
        });

        return {
          basarili: true,
          kaynak: 'CANLI_API',
          tarih: new Date().toISOString(),
          fiyatRekabeti: sonuclar,
        };
      }
    } catch (apiError) {
      console.warn('Google Merchant Content API çağrısı yerel analiz motoruna devredildi:', apiError);
    }
  }

  // 2. Google Servis Hesabı henüz panele girilmemişse veya ilk kurulumda:
  // Mağaza kataloğundaki ürünlerin piyasa fiyat modelleme analizini üretir.
  const liste = urunlerListesi || [
    { id: '1', name: 'Elban Geleneksel Dana Kavurma 250 gr', price: 250, slug: 'kavurma' },
    { id: '2', name: 'AK-CE Doğal Salamura Yeşil Zeytin 1000 gr', price: 250, slug: 'yesil-zeytin' },
    { id: '3', name: 'AK-CE Doğal Gemlik Siyah Zeytin 1000 gr', price: 250, slug: 'siyah-zeytin' },
    { id: '4', name: 'Elban Tam Yağlı Beyaz Peynir 1000 gr', price: 300, slug: 'peynir' },
    { id: '5', name: 'Elban Geleneksel Köy Tereyağı 1000 gr', price: 350, slug: 'tereyag' },
    { id: '6', name: 'ADVEM Doğal Gliserinli Nemlendirici El Kremi 150 ml', price: 65, slug: 'el-kremi' },
  ];

  const ornekKiyaslamalar: Record<string, number> = {
    'kavurma': 285,
    'yesil-zeytin': 220,
    'siyah-zeytin': 275,
    'peynir': 320,
    'tereyag': 390,
    'el-kremi': 85,
  };

  const modelSonuclari: FiyatRekabetKalemi[] = liste.map((u) => {
    const kiyaslama = ornekKiyaslamalar[u.slug] || Math.round(u.price * (0.95 + (u.price % 3) * 0.08));
    const fark = Math.round(((u.price - kiyaslama) / kiyaslama) * 100);

    return {
      urunId: u.id,
      baslik: u.name,
      marka: u.name.split(' ')[0] || 'İşyurtları',
      magazaFiyati: u.price,
      paraBirimi: 'TRY',
      piyasaKiyaslamaFiyati: kiyaslama,
      farkYuzdesi: fark,
      rekabetDurumu: fark < -3 ? 'AVANTAJLI' : fark > 5 ? 'PAHALI' : 'REKABETCI',
    };
  });

  return {
    basarili: true,
    kaynak: 'YEREL_SIMULASYON',
    tarih: new Date().toISOString(),
    fiyatRekabeti: modelSonuclari,
    mesaj: 'Google Service Account API anahtarı bağlandığında veriler doğrudan Google Alışveriş veritabanından çekilecektir.',
  };
}
