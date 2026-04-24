import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, startDate, endDate, active, products } = await req.json();

    // Delete old products and create new ones if provided
    if (products) {
      await prisma.campaignProduct.deleteMany({ where: { campaignId: params.id } });
    }

    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        active,
        ...(products && {
          products: {
            create: products.map((p: { id: string; discount: number }) => ({
              productId: p.id,
              discount: p.discount,
            })),
          },
        }),
      },
      include: { products: { include: { product: true } } },
    });

    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.campaign.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
