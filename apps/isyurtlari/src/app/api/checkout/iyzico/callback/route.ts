import { NextRequest, NextResponse } from 'next/server';
import { iyzicoIstek, IYZICO_YOLLARI, odemeGecerli } from '@/lib/iyzico';
import { prisma } from '@isyurtlari/database';
import { siparisMuhasebeyeIsle, odemeTahsilatiIsle } from '@/lib/muhasebe-entegrasyonu';

export const dynamic = 'force-dynamic';


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

    // 2. iyzico'dan ödeme sonucunu doğrula
    const yanit = await iyzicoIstek(IYZICO_YOLLARI.formSonucu, { locale: 'tr', token }, apiAnahtari, gizliAnahtar);
    const sonuc = await yanit.json().catch(() => ({}));

    // 3. Ödeme Başarılı mı? (tutar, sipariş bulunduktan sonra ayrıca doğrulanıyor)
    const basarili = sonuc?.status === 'success' && sonuc?.paymentStatus === 'SUCCESS';

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

    if (!odemeGecerli(sonuc, siparis.totalAmount)) {
      console.error('iyzico callback: tutar/fraud doğrulaması başarısız', {
        orderNumber,
        beklenen: siparis.totalAmount,
        gelen: sonuc?.paidPrice,
        fraudStatus: sonuc?.fraudStatus,
      });
      return NextResponse.redirect(`${siteUrl}/checkout?hata=odeme_dogrulanamadi`, 303);
    }

    // Aynı token tekrar gelirse tahsilat/muhasebe ikinci kez yazılmasın.
    const ilkKezOnaylandi = await prisma.$transaction(async (tx) => {
      const guncellenen = await tx.order.updateMany({
        where: { id: siparis.id, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });
      if (guncellenen.count === 0) return false;

      await tx.payment.updateMany({
        where: {
          description: { contains: siparis.orderNumber },
        },
        data: {
          status: 'COMPLETED',
        },
      });
      return true;
    });

    if (!ilkKezOnaylandi) {
      return NextResponse.redirect(`${siteUrl}/order-confirmation/${siparis.id}?odeme=basarili`, 303);
    }

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
      `${siteUrl}/order-confirmation/${siparis.id}?odeme=basarili`,
      303
    );
  } catch (error) {
    console.error('iyzico callback genel hatası:', error);
    return NextResponse.redirect(`${siteUrl}/checkout?hata=sistem_hatasi`, 303);
  }
}
