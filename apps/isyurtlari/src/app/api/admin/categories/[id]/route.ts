import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  await prisma.productCategory.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
