import { prisma } from '@isyurtlari/database';
import { adminGuard, adminEpostasi } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';

const denetle = (req: NextRequest, eylem: string, ayrinti: string) =>
  logAudit(eylem, adminEpostasi(req) || 'bilinmiyor', 'success', ayrinti, req.headers.get('x-forwarded-for') || 'unknown');
import { icerikTazele } from '@/lib/kategoriler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const red = adminGuard(req);
  if (red) return red;

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true },
  });
  if (!product) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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

  await denetle(req, 'PRODUCT_UPDATE', `${product.id} ${product.slug} fiyat=${product.price} stok=${product.quantity}`);

  // Slug ve kategori degisebiliyor: ikisi de sitemap ve kategori sayilarini
  // etkiliyor.
  icerikTazele();

  return NextResponse.json(product);
}

/**
 * Yalnizca gorsel adresini gunceller.
 *
 * PUT kullanilamaz: tum alanlari yaziyor ve `Number(undefined) || 0` ifadeleri
 * yuzunden eksik gonderilen fiyat ve stok sifirlaniyor. Toplu gorsel
 * optimizasyonu icin guvenli olan bu uc.
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
  await denetle(req, 'PRODUCT_IMAGE', `${product.id} ${imageUrl}`);
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const red = adminGuard(req);
  if (red) return red;

  const silinen = await prisma.product.delete({ where: { id: params.id }, select: { id: true, slug: true, name: true } });
  await denetle(req, 'PRODUCT_DELETE', `${silinen.id} ${silinen.slug} ${silinen.name}`);

  // Kenar cubugundaki kategori urun sayilari guncellensin.
  icerikTazele();

  return NextResponse.json({ ok: true });
}
