import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { prisma } from '@isyurtlari/database';
import { merchantRekabetRaporuGetir } from '@/lib/google-merchant-api';
import { hasDatabaseUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = adminGuard(req);
  if (guard) return guard;

  try {
    let products: any[] = [];

    if (hasDatabaseUrl()) {
      products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          purchasePrice: true,
          vatRate: true,
          slug: true,
          imageUrl: true,
          category: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      });
    }

    const rapor = await merchantRekabetRaporuGetir(products.length > 0 ? products : undefined);
    return NextResponse.json(rapor, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Merchant reports API error:', error);
    return NextResponse.json(
      { error: 'Rapor oluşturulurken hata meydana geldi' },
      { status: 500 }
    );
  }
}
