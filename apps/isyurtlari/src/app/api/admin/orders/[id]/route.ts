import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  const { status } = await req.json();

  /**
   * Teslim damgası.
   *
   * Cayma süresi SİPARİŞ tarihinden değil TESLİM tarihinden sayılıyor;
   * durum DELIVERED'a çekildiğinde o anı kaydetmezsek 14 günlük pencere
   * doğru hesaplanamaz. Bir kez yazılıyor: sipariş yanlışlıkla başka bir
   * duruma alınıp tekrar DELIVERED yapılırsa süre baştan başlamamalı.
   */
  const mevcut = await prisma.order.findUnique({
    where: { id: params.id },
    select: { deliveredAt: true },
  });

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      ...(status === 'DELIVERED' && !mevcut?.deliveredAt ? { deliveredAt: new Date() } : {}),
    },
  });

  return NextResponse.json(order);
}
