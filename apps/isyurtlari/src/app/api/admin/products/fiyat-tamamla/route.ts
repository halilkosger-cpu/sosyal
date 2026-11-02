import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { ONERILEN_PIYASA_FIYATLARI } from '@/lib/onerilen-fiyatlar';
import { icerikTazele } from '@/lib/kategoriler';

export const dynamic = 'force-dynamic';

const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' };

/**
 * GET: Fiyatsız kalan ürünlerin ve atanacak öneri fiyatlarının listesini döndürür.
 */
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const fiyatsizUrunler = await prisma.product.findMany({
    where: {
      price: { lte: 0 },
    },
    include: {
      category: { select: { name: true } },
    },
  });

  const liste = fiyatsizUrunler.map((u) => {
    const oneri = ONERILEN_PIYASA_FIYATLARI[u.slug];
    return {
      slug: u.slug,
      name: u.name,
      kategori: u.category?.name ?? 'Diğer',
      mevcutFiyat: u.price,
      onerilenFiyat: oneri?.price ?? 250,
      onerilenMaliyet: oneri?.purchasePrice ?? 160,
      onerilenKdv: oneri?.vatRate ?? 10,
    };
  });

  return NextResponse.json({ toplam: liste.length, urunler: liste }, { headers: NO_CACHE });
}

/**
 * POST: Tüm fiyatsız (0 TL) ürünlere önerilen piyasa fiyatlarını topluca uygular.
 */
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const guncellenecekler = Object.entries(ONERILEN_PIYASA_FIYATLARI);

  const sonuclar = await prisma.$transaction(
    guncellenecekler.map(([slug, deger]) =>
      prisma.product.updateMany({
        where: {
          slug,
          price: { lte: 0 },
        },
        data: {
          price: deger.price,
          purchasePrice: deger.purchasePrice,
          vatRate: deger.vatRate,
        },
      })
    )
  );

  const toplamGuncellenen = sonuclar.reduce((acc, curr) => acc + curr.count, 0);

  icerikTazele();

  return NextResponse.json(
    {
      success: true,
      mesaj: `${toplamGuncellenen} adet fiyatsız ürüne önerilen piyasa fiyatları ve maliyetleri başarıyla kaydedildi.`,
      guncellenenSayisi: toplamGuncellenen,
    },
    { headers: NO_CACHE }
  );
}
