import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';

export const dynamic = 'force-dynamic';

interface OrderRequest {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  items: { id: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod: 'CREDIT_CARD' | 'TRANSFER';
}

// Constants for impact calculations
const TRAINING_HOURS_PER_ITEM = 5;
const PRISONERS_PER_ITEM = 0.5; // 1 prisoner supported per 2 items

export async function POST(req: NextRequest) {
  try {
    const body: OrderRequest = await req.json();
    console.log('Order API - Body received:', body);

    // Validate input
    if (!body.customerName || !body.email || !body.phone || !body.shippingAddress || !body.items || body.items.length === 0) {
      console.log('Order API - Validation error: missing fields');
      return NextResponse.json({ error: 'Gerekli alanlar eksik' }, { status: 400 });
    }

    console.log('Order API - Validation passed, starting inventory check');

    // Validate inventory
    for (const item of body.items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      if (!product) {
        return NextResponse.json({ error: `Ürün bulunamadı: ${item.id}` }, { status: 400 });
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `${product.name} için yeterli stok yok (Mevcut: ${product.quantity})` },
          { status: 400 }
        );
      }
    }

    // Generate order number (simple sequential format: SG-2024-001)
    const latestOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    let nextNumber = 1;
    if (latestOrder?.orderNumber) {
      const match = latestOrder.orderNumber.match(/SG-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const year = new Date().getFullYear();
    const orderNumber = `SG-${year}-${String(nextNumber).padStart(3, '0')}`;

    // Calculate impact metrics
    const totalItemsCount = body.items.reduce((sum, item) => sum + item.quantity, 0);
    const trainingHoursFunded = totalItemsCount * TRAINING_HOURS_PER_ITEM;
    const prisonersSupportedCount = Math.ceil(totalItemsCount * PRISONERS_PER_ITEM);

    // Create order first (guest checkout - no userId)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        totalAmount: body.totalAmount,
        paymentMethod: body.paymentMethod,
        shippingAddress: body.shippingAddress,
        notes: `Müşteri: ${body.customerName} | Email: ${body.email} | Telefon: ${body.phone}`,
      },
    });

    // Create order items
    await Promise.all(
      body.items.map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          },
        })
      )
    );

    // Fetch order with items
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update product stock
    for (const item of body.items) {
      await prisma.product.update({
        where: { id: item.id },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        amount: body.totalAmount,
        currency: 'TRY',
        method: body.paymentMethod,
        status: body.paymentMethod === 'CREDIT_CARD' ? 'PENDING' : 'PENDING',
        description: `Sipariş #${orderNumber}`,
      },
    });

    return NextResponse.json({
      success: true,
      id: orderWithItems?.id,
      orderNumber: orderWithItems?.orderNumber,
      status: orderWithItems?.status,
      totalAmount: orderWithItems?.totalAmount,
      paymentMethod: orderWithItems?.paymentMethod,
      shippingAddress: orderWithItems?.shippingAddress,
      items: orderWithItems?.items || [],
      orderItems: orderWithItems?.items || [],
      impact: {
        trainingHoursFunded,
        prisonersSupportedCount,
        totalItemsCount,
        missionMessage: `🎉 Tebrikler! Adalet Bakanlığı'nın sosyal girişimine katkı sağladın: ${trainingHoursFunded} saat meslek eğitimi ve ${prisonersSupportedCount} hükümlünün yeniden başlamasını destekledin.`,
      },
      paymentRequired: body.paymentMethod === 'CREDIT_CARD',
      bankDetails:
        body.paymentMethod === 'TRANSFER'
          ? {
              accountName: process.env.BANK_ACCOUNT_NAME || 'Adalet Bakanlığı',
              iban: process.env.BANK_ACCOUNT_IBAN || 'TR...',
              branch: process.env.BANK_ACCOUNT_BRANCH || 'Ankara Şubesi',
              accountNo: process.env.BANK_ACCOUNT_NO || '...',
              message: `Lütfen havale açıklamasına sipariş numarasını yazınız: ${orderNumber}`,
            }
          : undefined,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Sipariş oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Sipariş ID gerekli' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Sipariş getirilemedi' }, { status: 500 });
  }
}
