import { NextRequest, NextResponse } from 'next/server';
import { bankaBilgileri, bankaBilgisiTam } from '@/lib/bank';
import { Resend } from 'resend';
import { prisma } from '@isyurtlari/database';
import { emailTemplates } from '@/lib/email-templates';

// Email sending function
async function sendOrderEmail(
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  shippingAddress: string,
  totalAmount: number,
  items: any[]
) {
  try {
    const recipientEmail = process.env.EMAIL_RECIPIENT || 'halil.kosger@gmail.com';
    const banka = bankaBilgileri();
    const bankName = banka.bankName;
    const accountName = banka.accountName;
    const iban = banka.iban;

    const itemsHtml = items
      .map(
        (item: any) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product?.name || 'Ürün'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₺${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
      )
      .join('');

    const emailContent = `
      <h2 style="color: #FF6000;">🎉 YENİ SİPARİŞ GELDİ!</h2>
      <hr style="border: none; border-top: 2px solid #FF6000; margin: 20px 0;">

      <h3>Müşteri Bilgileri:</h3>
      <p><strong>Adı Soyadı:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Telefon:</strong> ${customerPhone}</p>
      <p><strong>Teslimat Adresi:</strong> ${shippingAddress}</p>
      <p><strong>Sipariş Numarası:</strong> ${orderNumber}</p>

      <h3>Sipariş Detayları:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Ürün Adı</th>
            <th style="padding: 8px; text-align: center;">Miktar</th>
            <th style="padding: 8px; text-align: right;">Fiyat</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3 style="margin-top: 20px;">Ödeme Bilgileri:</h3>
      <p><strong>Toplam Tutar:</strong> <span style="font-size: 18px; color: #FF6000;">₺${totalAmount.toFixed(2)}</span></p>
      <p><strong>Ödeme Yöntemi:</strong> Havale/EFT</p>

      <h3>Havale Detayları:</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF6000;">
        <p><strong>Banka:</strong> ${bankName}</p>
        <p><strong>Hesap Sahibi:</strong> ${accountName}</p>
        <p><strong>IBAN:</strong> <code style="background: #eee; padding: 5px;">${iban}</code></p>
        <p style="color: #666; font-size: 12px;"><em>Havale açıklamasına sipariş numarasını yazınız: ${orderNumber}</em></p>
      </div>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">Bu email isyurtlari.com.tr otomatik sipariş bildirimi sistemi tarafından gönderilmiştir.</p>
    `;

    // Using Resend SDK - send to admin
    if (process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

      // Admin notification
      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: recipientEmail,
        subject: `📦 Yeni Sipariş: ${orderNumber}`,
        html: emailContent,
      });

      // Customer confirmation email with template
      const customerEmailHtml = emailTemplates.orderConfirmation({
        orderNumber,
        customerName,
        items: items.map((item: any) => ({
          name: item.product?.name || 'Ürün',
          quantity: item.quantity,
          price: item.price,
        })),
        total: totalAmount,
        bankName,
        accountName,
        iban,
      });

      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: customerEmail,
        subject: `✅ Siparişiniz Onaylandı - #${orderNumber}`,
        html: customerEmailHtml,
      });
    } else {
      // Fallback: log to console
      console.log(`📧 Email would be sent to ${recipientEmail}: Order ${orderNumber}`);
    }
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't fail the order if email fails
  }
}

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

    // Send email notification
    await sendOrderEmail(
      orderNumber,
      body.customerName,
      body.email,
      body.phone,
      body.shippingAddress,
      body.totalAmount,
      orderWithItems?.items || []
    );

    return NextResponse.json({
      success: true,
      id: orderWithItems?.id,
      orderId: orderWithItems?.id,
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
        missionMessage: `🎉 Tebrikler! Sosyal Girişim'e katkı sağladın: ${trainingHoursFunded} saat meslek eğitimi ve ${prisonersSupportedCount} hükümlünün yeniden başlamasını destekledin.`,
      },
      paymentRequired: body.paymentMethod === 'CREDIT_CARD',
      bankDetails:
        body.paymentMethod === 'TRANSFER'
          ? {
              ...bankaBilgileri(),
              eksik: !bankaBilgisiTam(),
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

    if (!orderId || orderId === 'undefined') {
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

    // Bu uc kimlik dogrulamasi istemiyor: misafir siparisi veren musteri de
    // onay sayfasini gorebilmeli. Erisim, tahmin edilmesi zor siparis
    // kimligine dayaniyor. Bu yuzden yaniti sayfanin ihtiyaci kadar
    // tutuyoruz - `...order` ile tum kaydi dokmek userId, paymentId gibi
    // sayfanin kullanmadigi alanlari da disari veriyordu.
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items || [],
      orderItems: order.items || [],
      bankDetails: order.paymentMethod === 'TRANSFER'
        ? {
            ...bankaBilgileri(),
            eksik: !bankaBilgisiTam(),
          }
        : undefined,
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Sipariş getirilemedi' }, { status: 500 });
  }
}
