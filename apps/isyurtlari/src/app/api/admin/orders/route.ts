import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            select: { name: true, purchasePrice: true, vatRate: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(orders);
}
