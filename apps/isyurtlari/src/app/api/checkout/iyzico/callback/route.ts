import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@isyurtlari/database';
import { siparisMuhasebeyeIsle, odemeTahsilatiIsle } from '@/lib/muhasebe-entegrasyonu';

export const dynamic = 'force-dynamic';

function imzaUret(istek: string, gizliAnahtar: string): string {
  return crypto.createHmac('sha1', gizliAnahtar).update(istek).digest('base64');
}

export async function POST(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://isyurtlari.com.tr';

  try {
    // 1. iyzico token parametresini form veya json'dan al
    let token = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      token = (formData.get('token') as string) || '';
    } else {
      const body = await req.json().catch(() => ({}));
      token = body?.token || '';
    }

    if (!token) {
      console.error('iyzico callback: token bulunamadı');
      return NextResponse.redirect(`${siteUrl}/checkout?hata=token_bulunamadi`, 303);
    }

    const apiAnahtari = process.env.IYZICO_API_KEY;
    const gizliAnahtar = process.env.IYZICO_SECRET_KEY;

    if (!apiAnahtari || !gizliAnahtar) {
      console.error('iyzico callback: API anahtarları eksik');
      return NextResponse.redirect(`${siteUrl}/checkout?hata=odeme_yapilandirilmamis`, 303);
    }

    // 2. iyzico'dan ödeme sonucunu doğrula (retrieve)
    const istekGovdesi = JSON.stringify({
      locale: 'tr',
      token,
    });
    const imza = imzaUret(istekGovdesi, gizliAnahtar);

    const ucAdresi =
      process.env.NODE_ENV === 'production'
        ? 'https://api.iyzipay.com/v2/checkoutform/auth/retrieve'
        : 'https://sandbox-api.iyzipay.com/v2/checkoutform/auth/retrieve';

    const yanit = await fetch(ucAdresi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${apiAnahtari}:${gizliAnahtar}`).toString('base64')}`,
        'X-IYZIPAY-REQUEST-SIGNATURE': imza,
      },
      body: istekGovdesi,
    });

    const sonuc = await yanit.json().catch(() => ({}));

    // 3. Ödeme Başarılı mı?
    const basarili =
      sonuc?.status === 'success' &&
      (sonuc?.paymentStatus === 'SUCCESS' || sonuc?.fraudStatus === 1);

    const orderNumber = sonuc?.basketId || '';

    if (!basarili || !orderNumber) {
      console.error('iyzico ödeme başarısız:', {
        errorMessage: sonuc?.errorMessage,
        orderNumber,
        status: sonuc?.status,
        paymentStatus: sonuc?.paymentStatus,
      });

      return NextResponse.redirect(
        `${siteUrl}/checkout?hata=${encodeURIComponent(sonuc?.errorMessage || 'Ödeme tamamlanamadı')}`,
        303
      );
    }

    // 4. Siparişi Bul ve Durumunu Güncelle
    const siparis = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (!siparis) {
      console.error('iyzico callback: Sipariş veritabanında bulunamadı:', orderNumber);
      return NextResponse.redirect(`${siteUrl}/checkout?hata=siparis_bulunamadi`, 303);
    }

    // Ödeme durumunu güncelle
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: siparis.id },
        data: {
          status: 'CONFIRMED',
        },
      });

      await tx.payment.updateMany({
        where: {
          description: { contains: siparis.orderNumber },
        },
        data: {
          status: 'COMPLETED',
        },
      });
    });

    // 5. Logo GO3 Entegrasyonu:
    // a) Fatura ve Borç kaydı (henüz yapılmamışsa)
    await siparisMuhasebeyeIsle({
      orderId: siparis.id,
      orderNumber: siparis.orderNumber,
      customerName: siparis.customer?.name || 'Müşteri',
      email: siparis.customer?.email || '',
      phone: siparis.customer?.phone || '',
      shippingAddress: siparis.shippingAddress,
      totalAmount: siparis.totalAmount,
      paymentMethod: 'CREDIT_CARD',
      items: siparis.items.map((it) => ({
        productId: it.productId,
        name: it.product?.name || 'Ürün',
        quantity: it.quantity,
        price: it.price,
        vatRate: it.product?.vatRate ?? 20,
      })),
    });

    // b) Tahsilat & Cari Kapatma & POS Komisyon Gideri
    await odemeTahsilatiIsle({
      orderId: siparis.id,
      orderNumber: siparis.orderNumber,
      paymentMethod: 'CREDIT_CARD',
      tutar: siparis.totalAmount,
      komisyonOrani: 2.99, // iyzico standart komisyon oranı
    });

    // 6. Başarılı Onay Sayfasına Yönlendir
    return NextResponse.redirect(
      `${siteUrl}/order-confirmation/${siparis.orderNumber}?odeme=basarili`,
      303
    );
  } catch (error) {
    console.error('iyzico callback genel hatası:', error);
    return NextResponse.redirect(`${siteUrl}/checkout?hata=sistem_hatasi`, 303);
  }
}
