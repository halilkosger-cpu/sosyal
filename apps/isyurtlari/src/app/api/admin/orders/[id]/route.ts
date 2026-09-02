import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  const { status } = await req.json();
  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(order);
}
