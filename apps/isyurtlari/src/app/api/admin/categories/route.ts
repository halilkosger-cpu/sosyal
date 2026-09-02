import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const categories = await prisma.productCategory.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const { name, slug, description } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
  const category = await prisma.productCategory.create({ data: { name, slug, description: description || null } });
  return NextResponse.json(category, { status: 201 });
}
