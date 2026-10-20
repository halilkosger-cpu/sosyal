import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const products = await prisma.product.findMany({
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

    // Kritik stok filtresi: Mevcut stok eşiğe eşit veya altındaysa
    const criticalProducts = products.filter(
      (p) => p.quantity <= (p.minStockLevel ?? 5)
    );

    return NextResponse.json({
      criticalCount: criticalProducts.length,
      products: criticalProducts,
    });
  } catch (error) {
    console.error('Kritik stok listeleme hatası:', error);
    return NextResponse.json({ error: 'Kritik stok listesi alınamadı' }, { status: 500 });
  }
}
