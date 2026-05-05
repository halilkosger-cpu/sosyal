import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

export async function GET() {
  if (!hasDatabaseUrl()) {
    return NextResponse.json([]);
  }

  try {
    const now = new Date();
    const activeCampaigns = await prisma.campaign.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        products: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json(activeCampaigns);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
