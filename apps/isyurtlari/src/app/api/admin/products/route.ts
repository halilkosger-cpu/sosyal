import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { icerikTazele } from '@/lib/kategoriler';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const { name, slug, description, categoryId, price, quantity, imageUrl } = await req.json();

  if (!name || !slug || !description || !categoryId) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { name, slug, description, categoryId, price: Number(price) || 0, quantity: Number(quantity) || 0, imageUrl: imageUrl || null },
  });
  // Kenar cubugu kategori basina urun sayisi gosteriyor; onbellek tazelensin.
  icerikTazele();

  return NextResponse.json(product, { status: 201 });
}
