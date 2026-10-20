import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET: Stok hareketlerini listele
export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (productId) where.productId = productId;

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: { name: true, slug: true, quantity: true, purchasePrice: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Stok hareketleri listeleme hatası:', error);
    return NextResponse.json({ error: 'Stok hareketleri alınamadı' }, { status: 500 });
  }
}

// POST: Yeni Stok Girişi ve Ağırlıklı Ortalama Maliyet (WAV) Güncelleme
export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const body = await req.json();
    const { productId, quantity, unitCost, invoiceNo, supplier, notes } = body;

    const qty = parseInt(quantity, 10);
    const cost = parseFloat(unitCost);

    if (!productId || isNaN(qty) || qty <= 0 || isNaN(cost) || cost < 0) {
      return NextResponse.json({ error: 'Geçerli ürün, pozitif adet ve birim maliyet gereklidir' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mevcut ürünü ve stoğu al
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Ürün bulunamadı');
      }

      const currentStock = Math.max(0, product.quantity);
      const currentCost = product.purchasePrice || 0;

      // 2. Ağırlıklı Ortalama Maliyet (WAV) Hesabı:
      // Yeni Birim Maliyet = ((Mevcut Stok * Mevcut Maliyet) + (Yeni Adet * Yeni Maliyet)) / (Toplam Stok)
      const totalStock = currentStock + qty;
      const newAverageCost = totalStock > 0 
        ? ((currentStock * currentCost) + (qty * cost)) / totalStock
        : cost;

      // 3. Stok hareketini kaydet
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity: qty,
          unitCost: cost,
          totalCost: cost * qty,
          invoiceNo: invoiceNo?.trim() || null,
          supplier: supplier?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      // 4. Ürünün stok adedini ve ağırlıklı ortalama maliyetini güncelle
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          quantity: totalStock,
          purchasePrice: Math.round((newAverageCost + Number.EPSILON) * 100) / 100,
        },
      });

      return { movement, product: updatedProduct };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Stok girişi hatası:', error);
    return NextResponse.json({ error: error.message || 'Stok girişi yapılamadı' }, { status: 500 });
  }
}
