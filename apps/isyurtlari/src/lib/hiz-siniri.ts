import { prisma } from '@isyurtlari/database';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Herkese acik formlar icin hiz siniri.
 *
 * Sorun: /api/contact, /api/preorders ve yorum ucu sinirsiz istek kabul
 * ediyordu. Bir bot binlerce sahte on talep ya da yorum gonderebilir, e-posta
 * kotasini tuketebilir ve yonetim panelini kullanilamaz hale getirebilirdi.
 *
 * Sayac veritabaninda tutuluyor: uygulama sunucusuz calisiyor ve her istek
 * ayri bir ornekte islenebiliyor, bu yuzden bellekteki sayac guvenilir degil.
 *
 * Sayma tek bir SQL ifadesiyle yapiliyor. Once okuyup sonra yazsaydik ayni
 * anda gelen istekler ayni degeri okur ve siniri birlikte asardi.
 */

/** Vercel arkasindaki gercek istemci adresi. */
export function istemciAdresi(req: NextRequest): string {
  const iletilen = req.headers.get('x-forwarded-for');
  if (iletilen) return iletilen.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'bilinmeyen';
}

interface SinirSonucu {
  asildi: boolean;
  adet: number;
}

/**
 * Sayaci artirir ve sinirin asilip asilmadigini dondurur.
 *
 * Pencere kaydirmali degil sabit: pencere suresi dolunca sayac sifirlanir.
 * Bu is icin yeterli ve tek ifadeyle atomik yazilabiliyor.
 */
export async function hizSiniri(
  anahtar: string,
  azamiIstek: number,
  pencereSaniye: number
): Promise<SinirSonucu> {
  try {
    const satirlar = await prisma.$queryRawUnsafe<{ adet: number }[]>(
      `
      INSERT INTO "IstekSayaci" ("anahtar", "adet", "pencereBaslangic")
      VALUES ($1, 1, NOW())
      ON CONFLICT ("anahtar") DO UPDATE SET
        "adet" = CASE
          WHEN "IstekSayaci"."pencereBaslangic" < NOW() - ($2 * INTERVAL '1 second')
          THEN 1
          ELSE "IstekSayaci"."adet" + 1
        END,
        "pencereBaslangic" = CASE
          WHEN "IstekSayaci"."pencereBaslangic" < NOW() - ($2 * INTERVAL '1 second')
          THEN NOW()
          ELSE "IstekSayaci"."pencereBaslangic"
        END
      RETURNING "adet";
      `,
      anahtar,
      pencereSaniye
    );

    const adet = satirlar[0]?.adet ?? 0;
    return { asildi: adet > azamiIstek, adet };
  } catch (error) {
    // Sayac tablosu yoksa ya da veritabani erisilemezse istegi engellemiyoruz:
    // hiz siniri bir koruma katmani, sitenin calismasinin sarti degil.
    console.error('Hiz siniri okunamadi:', error);
    return { asildi: false, adet: 0 };
  }
}

/**
 * Uc icin hazir kontrol. Sinir asilmissa dondurulecek yaniti, asilmamissa
 * null dondurur - adminGuard ile ayni kullanim kalibi.
 */
export async function hizSiniriGuard(
  req: NextRequest,
  uc: string,
  azamiIstek: number,
  pencereSaniye: number
): Promise<NextResponse | null> {
  const { asildi } = await hizSiniri(`${uc}:${istemciAdresi(req)}`, azamiIstek, pencereSaniye);

  if (!asildi) return null;

  return NextResponse.json(
    { error: 'Çok fazla istek gönderdiniz. Lütfen bir süre sonra tekrar deneyin.' },
    { status: 429, headers: { 'Retry-After': String(pencereSaniye) } }
  );
}

/**
 * Suresi gecmis sayac satirlarini siler.
 *
 * Her istekte calistirmak gereksiz yuk olurdu; cagiran uclar bunu dusuk bir
 * olasilikla tetikliyor. Tablonun sinirsiz buyumesini engellemek icin yeterli.
 */
export async function sayaclariTemizle(olasilik = 0.02): Promise<void> {
  if (Math.random() > olasilik) return;
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "IstekSayaci" WHERE "pencereBaslangic" < NOW() - INTERVAL '1 day';`
    );
  } catch {
    // Temizlik basarisiz olursa sessiz gecilir; islevsel bir etkisi yok.
  }
}
