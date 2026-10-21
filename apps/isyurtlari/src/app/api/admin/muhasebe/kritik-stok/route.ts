import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'critical'; // 'critical' | 'outOfStock' | 'all'
    const q = searchParams.get('q')?.toLowerCase() || '';

    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        quantity: true,
        minStockLevel: true,
        price: true,
        purchasePrice: true,
        vatRate: true,
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    const criticalProducts = allProducts.filter(
      (p) => p.quantity <= (p.minStockLevel ?? 5)
    );
    const outOfStockProducts = allProducts.filter((p) => p.quantity <= 0);

    let filtered = allProducts;
    if (filter === 'critical') {
      filtered = criticalProducts;
    } else if (filter === 'outOfStock') {
      filtered = outOfStockProducts;
    }

    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      filter,
      totalCount: allProducts.length,
      criticalCount: criticalProducts.length,
      outOfStockCount: outOfStockProducts.length,
      products: filtered,
    });
  } catch (error) {
    console.error('Kritik stok listeleme hatası:', error);
    return NextResponse.json({ error: 'Kritik stok listesi alınamadı' }, { status: 500 });
  }
}

// PUT: Ürünün stok adedini, kritik eşik seviyesini veya maliyetini güncelle
export async function PUT(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { productId, quantity, minStockLevel, purchasePrice } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Ürün ID zorunludur' }, { status: 400 });
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = Math.max(0, parseInt(quantity, 10) || 0);
    if (minStockLevel !== undefined) updateData.minStockLevel = Math.max(0, parseInt(minStockLevel, 10) || 0);
    if (purchasePrice !== undefined) updateData.purchasePrice = Math.max(0, parseFloat(purchasePrice) || 0);

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        name: true,
        quantity: true,
        minStockLevel: true,
        purchasePrice: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ürün stok ve eşik bilgileri güncellendi',
      product: updated,
    });
  } catch (error) {
    console.error('Kritik stok güncelleme hatası:', error);
    return NextResponse.json({ error: 'Ürün stok bilgileri güncellenemedi' }, { status: 500 });
  }
}
