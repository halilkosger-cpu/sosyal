import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';
/** Paylasilan istemci: bkz. api/admin/campaigns/route.ts */
import { prisma } from '@isyurtlari/database';
import { icerikTazele } from '@/lib/kategoriler';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

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

    icerikTazele();

    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    await prisma.campaign.delete({ where: { id: params.id } });
    icerikTazele();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
