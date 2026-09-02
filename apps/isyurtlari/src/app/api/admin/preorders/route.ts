import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

/** Ön talepleri listeler. ?productId= ve ?status= ile filtrelenebilir. */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ preOrders: [], summary: [] });
  }

  const productId = req.nextUrl.searchParams.get('productId');
  const status = req.nextUrl.searchParams.get('status');

  const where: any = {};
  if (productId) where.productId = productId;
  if (status) where.status = status;

  const [preOrders, grouped] = await Promise.all([
    prisma.preOrder.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, slug: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Ürün bazında bekleyen talep özeti
    prisma.preOrder.groupBy({
      by: ['productId'],
      where: { status: 'WAITING' },
      _count: { _all: true },
      _sum: { quantity: true },
    }),
  ]);

  const products = grouped.length
    ? await prisma.product.findMany({
        where: { id: { in: grouped.map((g) => g.productId) } },
        select: { id: true, name: true, slug: true, quantity: true },
      })
    : [];

  const summary = grouped
    .map((g) => {
      const product = products.find((p) => p.id === g.productId);
      return {
        productId: g.productId,
        productName: product?.name ?? 'Silinmiş ürün',
        productSlug: product?.slug ?? null,
        currentStock: product?.quantity ?? 0,
        waitingCount: g._count._all,
        totalQuantity: g._sum.quantity ?? 0,
      };
    })
    .sort((a, b) => b.waitingCount - a.waitingCount);

  return NextResponse.json({ preOrders, summary });
}

/** Bir ön talebin durumunu günceller (ör. CONVERTED / CANCELLED). */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: 'Servis kullanılamıyor' }, { status: 503 });
  }

  const { id, status } = await req.json();
  const allowed = ['WAITING', 'NOTIFIED', 'CONVERTED', 'CANCELLED'];

  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  const updated = await prisma.preOrder.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ success: true, preOrder: updated });
}
