import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/products/[slug]/reviews - Onaylanmış yorumları getir
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id, approved: true },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/products/[slug]/reviews - Yorum ekle (login gerekli)
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { userId, rating, title, text } = await req.json();

    if (!userId || !rating || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Kullanıcının bu ürünü satın almış olup olmadığını kontrol et
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: { userId },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: 'You must purchase this product to leave a review' },
        { status: 403 }
      );
    }

    // Duplicate check - aynı ürün için aynı kullanıcıdan 1 yorum
    const existingReview = await prisma.review.findFirst({
      where: { productId: product.id, userId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId,
        rating,
        title,
        text,
        approved: false, // Admin onay bekliyor
      },
      include: { user: { select: { name: true, avatar: true } } },
    });

    return NextResponse.json(
      { ...review, message: 'Review submitted! Awaiting admin approval.' },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
