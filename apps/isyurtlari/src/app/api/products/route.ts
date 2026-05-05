import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

export async function GET(req: NextRequest) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json([]);
  }

  try {
    const categorySlug = req.nextUrl.searchParams.get('category');
    const search = req.nextUrl.searchParams.get('search');

    const where: any = {};

    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const now = new Date();
    const products = await prisma.product.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format campaign info
    const productsWithCampaigns = products.map((p: any) => ({
      ...p,
      campaign: p.campaigns[0]
        ? {
            id: p.campaigns[0].campaign.id,
            name: p.campaigns[0].campaign.name,
            discount: p.campaigns[0].discount,
            discountedPrice: p.price * (1 - p.campaigns[0].discount / 100),
          }
        : null,
      campaigns: undefined,
    }));

    return NextResponse.json(productsWithCampaigns);
  } catch (error) {
    console.error('Ürün listesi hatası:', error);
    return NextResponse.json(
      { error: 'Ürünler yüklenemedi' },
      { status: 500 }
    );
  }
}
