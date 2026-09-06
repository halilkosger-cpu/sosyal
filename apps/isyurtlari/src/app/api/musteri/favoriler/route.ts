import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { musteriGuard } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Musterinin favorileri.
 *
 * Sepetle ayni kalip: calisan kopya tarayicida (lib/favoriler.ts), burasi
 * aynasi. Oku (GET) ve tumunu yaz (PUT) disinda islem yok; birlestirmeyi
 * istemci yapiyor.
 *
 * Sira korunuyor: musteri favoriye ekleme sirasini bekliyor, veritabani
 * sirasini degil. Bu yuzden createdAt'e gore artan siralaniyor ve PUT'ta
 * gelen sira createdAt olarak yaziliyor.
 */

const AZAMI_FAVORI = 300;

async function favorileriOku(customerId: string): Promise<string[]> {
  const satirlar = await prisma.favorite.findMany({
    where: { customerId },
    orderBy: { createdAt: 'asc' },
    select: { productId: true },
  });
  return satirlar.map((s) => s.productId);
}

export async function GET() {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    return NextResponse.json({ urunler: await favorileriOku(musteri.id) });
  } catch (error) {
    console.error('Favoriler okunamadı:', error);
    return NextResponse.json({ error: 'Favoriler okunamadı' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const govde: { urunler?: unknown } = await req.json();
    const gelen = Array.isArray(govde.urunler) ? govde.urunler : [];

    const kimlikler: string[] = [];
    for (const id of gelen) {
      if (typeof id !== 'string' || kimlikler.includes(id)) continue;
      kimlikler.push(id);
      if (kimlikler.length >= AZAMI_FAVORI) break;
    }

    // Silinmis urunler sessizce atiliyor: favori listesi aylarca tarayicida
    // bekleyebiliyor, tek bir olu kimlik yuzunden listeyi reddetmek yanlis.
    const gecerliler =
      kimlikler.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: kimlikler } },
            select: { id: true },
          })
        : [];

    const gecerliKume = new Set(gecerliler.map((u) => u.id));
    const sirali = kimlikler.filter((id) => gecerliKume.has(id));

    const simdi = Date.now();
    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { customerId: musteri.id } }),
      ...(sirali.length > 0
        ? [
            prisma.favorite.createMany({
              data: sirali.map((productId, sira) => ({
                customerId: musteri.id,
                productId,
                // Sira createdAt'e yaziliyor ki okurken ayni sirayla donsun.
                createdAt: new Date(simdi + sira),
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ urunler: sirali });
  } catch (error) {
    console.error('Favoriler yazılamadı:', error);
    return NextResponse.json({ error: 'Favoriler kaydedilemedi' }, { status: 500 });
  }
}
