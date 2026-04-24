import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const now = new Date();
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        campaigns: {
          where: {
            campaign: {
              active: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
          },
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    // Format campaign info
    const productWithCampaign = {
      ...product,
      campaign: product.campaigns[0]
        ? {
            id: product.campaigns[0].campaign.id,
            name: product.campaigns[0].campaign.name,
            discount: product.campaigns[0].discount,
            discountedPrice: product.price * (1 - product.campaigns[0].discount / 100),
          }
        : null,
      campaigns: undefined,
    };

    return NextResponse.json(productWithCampaign);
  } catch (error) {
    console.error('Ürün yüklenirken hata:', error);
    return NextResponse.json(
      { error: 'Ürün yüklenemedi' },
      { status: 500 }
    );
  }
}
