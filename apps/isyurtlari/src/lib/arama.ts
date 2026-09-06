import { prisma } from '@isyurtlari/database';

/**
 * Ürün araması.
 *
 * ─── NEDEN "contains" YETMİYORDU ──────────────────────────────────────
 *
 * Arama düz metin eşleşmesiydi: "zeytinyagi" yazan müşteri "Zeytinyağı"nı
 * bulamıyordu. Ölçüldü, tahmin değil - /api/products?search=zeytinyagi boş
 * dizi dönüyordu. Türkçede bu istisna değil kural: müşterilerin önemli bir
 * kısmı ğ/ü/ş/ı/ö/ç yazmadan arıyor.
 *
 * ─── NASIL ÇALIŞIYOR ──────────────────────────────────────────────────
 *
 * Hem ürün metni hem sorgu tr_normalize() ile aynı biçime indirgeniyor
 * (küçük harf + aksan sadeleştirmesi). Sonra üç ölçüt birleştiriliyor:
 *
 *   1. Tam eşleşme / baştan eşleşme / içinde geçme  -> yüksek puan
 *   2. Açıklamada geçme                             -> düşük puan
 *   3. Trigram benzerliği                           -> yazım hatası toleransı
 *      ("zeytinyagi" yerine "zeytinyagı", "zeytnyagi" gibi)
 *
 * Çok kelimeli sorgularda HER kelimenin eşleşmesi aranıyor: "dogal zeytin"
 * yazan biri yalnızca "doğal" geçen her ürünü değil, ikisini birden içeren
 * ürünleri görmeli.
 *
 * ─── YEDEK DAVRANIŞ ───────────────────────────────────────────────────
 *
 * Sorgu başarısız olursa (eklenti kurulmamış, izin yok) eski "contains"
 * davranışına düşülüyor. Arama zayıflar ama site çalışmaya devam eder.
 */

/** Benzerlik bu eşiğin altındaysa sonuç sayılmıyor. */
const BENZERLIK_ESIGI = 0.28;

/** Tek bir aramanın döndürebileceği azami eşleşme. */
const AZAMI_SONUC = 500;

export interface AramaSonucu {
  /** Alaka sırasına göre ürün kimlikleri. */
  kimlikler: string[];
  /** Kimlikten puana eşleme; sıralamayı korumak için. */
  puanlar: Map<string, number>;
  /** Trigram araması çalıştı mı? false ise yedek davranış kullanıldı. */
  gelismis: boolean;
}

const BOS: AramaSonucu = { kimlikler: [], puanlar: new Map(), gelismis: true };

/** Sorguyu kelimelere ayırır; çok kısa ve anlamsız parçaları eler. */
function kelimelereAyir(sorgu: string): string[] {
  return sorgu
    .trim()
    .split(/\s+/)
    .filter((k) => k.length >= 2)
    .slice(0, 6);
}

export async function urunAra(sorgu: string): Promise<AramaSonucu> {
  const temiz = sorgu.trim();
  if (!temiz) return BOS;

  const kelimeler = kelimelereAyir(temiz);
  if (kelimeler.length === 0) return BOS;

  try {
    /**
     * Her kelime için ayrı bir "eşleşiyor mu" koşulu üretiliyor ve hepsi
     * AND ile bağlanıyor. Puan ise tüm sorgunun kendisiyle hesaplanıyor:
     * "zeytin yagi" arayan için "Zeytinyağı" en üstte olmalı.
     */
    const kelimeKosullari = kelimeler
      .map(
        (_, i) => `(
          public.tr_normalize(p."name") LIKE '%' || public.tr_normalize($${i + 2}) || '%'
          OR public.tr_normalize(p."description") LIKE '%' || public.tr_normalize($${i + 2}) || '%'
          OR similarity(public.tr_normalize(p."name"), public.tr_normalize($${i + 2})) > ${BENZERLIK_ESIGI}
        )`
      )
      .join(' AND ');

    const satirlar = await prisma.$queryRawUnsafe<{ id: string; skor: number }[]>(
      `
      SELECT p."id",
        GREATEST(
          CASE
            WHEN public.tr_normalize(p."name") = public.tr_normalize($1)              THEN 1.00
            WHEN public.tr_normalize(p."name") LIKE public.tr_normalize($1) || '%'    THEN 0.90
            WHEN public.tr_normalize(p."name") LIKE '%' || public.tr_normalize($1) || '%' THEN 0.75
            WHEN public.tr_normalize(p."description") LIKE '%' || public.tr_normalize($1) || '%' THEN 0.40
            ELSE 0
          END,
          similarity(public.tr_normalize(p."name"), public.tr_normalize($1))
        )::float8 AS skor
      FROM "Product" p
      WHERE ${kelimeKosullari}
      ORDER BY skor DESC, p."name" ASC
      LIMIT ${AZAMI_SONUC};
      `,
      temiz,
      ...kelimeler
    );

    const puanlar = new Map(satirlar.map((s) => [s.id, s.skor]));
    return { kimlikler: satirlar.map((s) => s.id), puanlar, gelismis: true };
  } catch (error) {
    // Eklenti kurulmamışsa ya da fonksiyon yoksa arama tamamen ölmesin.
    console.error('Gelişmiş arama çalışmadı, basit aramaya düşülüyor:', error);

    const urunler = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: temiz, mode: 'insensitive' } },
          { description: { contains: temiz, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: AZAMI_SONUC,
    });

    return {
      kimlikler: urunler.map((u) => u.id),
      puanlar: new Map(urunler.map((u) => [u.id, 0.5])),
      gelismis: false,
    };
  }
}
