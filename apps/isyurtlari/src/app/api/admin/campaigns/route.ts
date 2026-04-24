import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { products: { include: { product: true } } },
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, startDate, endDate, products } = await req.json();

    const campaign = await prisma.campaign.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        products: {
          create: products.map((p: { id: string; discount: number }) => ({
            productId: p.id,
            discount: p.discount,
          })),
        },
      },
      include: { products: { include: { product: true } } },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
