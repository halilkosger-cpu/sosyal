import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { musteriGuard } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Musterinin siparis gecmisi.
 *
 * Siparisler /api/orders'ta olusturulurken oturumdaki musteriye baglaniyor
 * (Order.customerId). Burasi yalnizca o baga gore okuyor: misafir olarak
 * verilmis eski siparisler bu listede gorunmez, onlar siparis numarasi ve
 * e-posta ile /api/siparis-sorgula uzerinden sorgulanmaya devam ediyor.
 *
 * Sayfalama var: simdi az siparis var ama liste sinirsiz buyurse hem sorgu
 * hem yanit agirlasir.
 */

const SAYFA_BOYU = 20;

export async function GET(req: NextRequest) {
  const musteri = await musteriGuard();
  if (musteri instanceof NextResponse) return musteri;

  try {
    const sayfa = Math.max(1, Math.floor(Number(req.nextUrl.searchParams.get('sayfa')) || 1));
    const atla = (sayfa - 1) * SAYFA_BOYU;

    const [toplam, siparisler] = await Promise.all([
      prisma.order.count({ where: { customerId: musteri.id } }),
      prisma.order.findMany({
        where: { customerId: musteri.id },
        orderBy: { createdAt: 'desc' },
        take: SAYFA_BOYU,
        skip: atla,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          taxTotal: true,
          shippingCost: true,
          paymentMethod: true,
          shippingAddress: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: { select: { name: true, slug: true, imageUrl: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      siparisler: siparisler.map((s) => ({
        ...s,
        urunAdedi: s.items.reduce((t, k) => t + k.quantity, 0),
      })),
      sayfa,
      toplam,
      sonSayfa: atla + siparisler.length >= toplam,
    });
  } catch (error) {
    console.error('Siparişler okunamadı:', error);
    return NextResponse.json({ error: 'Siparişleriniz getirilemedi' }, { status: 500 });
  }
}
