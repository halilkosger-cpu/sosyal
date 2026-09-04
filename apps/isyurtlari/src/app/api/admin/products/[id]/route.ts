import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { kategorileriTazele } from '@/lib/kategoriler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  const data = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      price: Number(data.price) || 0,
      quantity: Number(data.quantity) || 0,
      imageUrl: data.imageUrl || null,
    },
  });
  return NextResponse.json(product);
}

/**
 * Yalnizca gorsel adresini gunceller.
 *
 * PUT kullanilamaz: tum alanlari yaziyor ve `Number(undefined) || 0` ifadeleri
 * yuzunden eksik gonderilen fiyat ve stok sifirlaniyor. Toplu gorsel
 * optimizasyonu icin guvenli olan bu uc.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  const { imageUrl } = await req.json();
  if (typeof imageUrl !== 'string' || !/^https:\/\/[^\s]+$/.test(imageUrl)) {
    return NextResponse.json({ error: 'Geçerli bir görsel adresi gerekli' }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { imageUrl },
    select: { id: true, name: true, imageUrl: true },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  await prisma.product.delete({ where: { id: params.id } });

  // Kenar cubugundaki kategori urun sayilari guncellensin.
  kategorileriTazele();

  return NextResponse.json({ ok: true });
}
