import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// Admin verisi tarayici onbelleginde kalmamali: stok bildirimi sonrasi
// liste bayat gorunuyordu.
const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' };

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

/** Ön talepleri listeler. ?productId= ve ?status= ile filtrelenebilir. */
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;


  if (!hasDatabaseUrl()) {
    return NextResponse.json({ preOrders: [], summary: [] }, { headers: NO_CACHE });
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

  return NextResponse.json({ preOrders, summary }, { headers: NO_CACHE });
}

/** Bir ön talebin durumunu veya atölye üretim aşamasını günceller. */
export async function PATCH(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: 'Servis kullanılamıyor' }, { status: 503 });
  }

  const body = await req.json();
  const { id, status, stage, note } = body;

  if (!id) {
    return NextResponse.json({ error: 'Geçersiz istek: id gerekli' }, { status: 400 });
  }

  const dataToUpdate: any = {};

  if (status) {
    const allowed = ['WAITING', 'NOTIFIED', 'CONVERTED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 });
    }
    dataToUpdate.status = status;
  }

  if (stage !== undefined) {
    const stageNum = Number(stage);
    if (isNaN(stageNum) || stageNum < 0 || stageNum > 4) {
      return NextResponse.json({ error: 'Geçersiz aşama (0-4 olmalı)' }, { status: 400 });
    }
    const current = await prisma.preOrder.findUnique({ where: { id }, select: { note: true } });
    const existingNote = note !== undefined ? note : (current?.note || '');
    const cleanNote = existingNote.replace(/\[AŞAMA:\s*\d\]/g, '').trim();
    dataToUpdate.note = `[AŞAMA: ${stageNum}] ${cleanNote}`.trim();
  } else if (note !== undefined) {
    dataToUpdate.note = note;
  }

  const updated = await prisma.preOrder.update({
    where: { id },
    data: dataToUpdate,
  });

  return NextResponse.json({ success: true, preOrder: updated });
}
