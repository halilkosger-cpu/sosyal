import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';

export const dynamic = 'force-dynamic';

// GET /api/favorites?userId=...
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            imageUrl: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST /api/favorites
export async function POST(req: NextRequest) {
  try {
    const { userId, productId } = await req.json();

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId required' }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Add to favorites (upsert - if exists, ignore)
    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {},
      create: { userId, productId },
      include: { product: true },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Favorite creation error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

// DELETE /api/favorites?userId=...&productId=...
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const productId = req.nextUrl.searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId required' }, { status: 400 });
    }

    await prisma.favorite.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorite deletion error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
