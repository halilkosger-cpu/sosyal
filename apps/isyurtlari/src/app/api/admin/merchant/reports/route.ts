import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
import { prisma } from '@isyurtlari/database';
import { merchantRekabetRaporuGetir } from '@/lib/google-merchant-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const guard = adminGuard(req);
  if (guard) return guard;

  try {
    const products = await prisma.product.findMany({
      where: { price: { gt: 0 } },
      select: { id: true, name: true, price: true, slug: true },
      take: 100,
    });

    const rapor = await merchantRekabetRaporuGetir(products);
    return NextResponse.json(rapor);
  } catch (error) {
    console.error('Merchant reports API error:', error);
    return NextResponse.json(
      { error: 'Rapor oluşturulurken hata meydana geldi' },
      { status: 500 }
    );
  }
}
