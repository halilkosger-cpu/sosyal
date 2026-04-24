import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function generateSignature(request: string, secretKey: string): string {
  return crypto.createHmac('sha1', secretKey).update(request).digest('base64');
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderNumber, totalAmount, customerEmail, customerName } = await req.json();

    if (!orderId || !totalAmount || !customerEmail) {
      return NextResponse.json(
        { error: 'Gerekli bilgiler eksik' },
        { status: 400 }
      );
    }

    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Iyzico credentials eksik' },
        { status: 500 }
      );
    }

    const [firstName, ...lastNameParts] = customerName.split(' ');

    const requestBody = {
      locale: 'tr',
      conversationId: orderId,
      price: totalAmount.toFixed(2),
      paidPrice: totalAmount.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId: orderId,
      paymentChannel: 'WEB',
      pageType: 'PRODUCT',
      clientIp: req.headers.get('x-forwarded-for') || '127.0.0.1',

      // Buyer
      buyer: {
        id: orderNumber,
        name: firstName || 'Alıcı',
        surname: lastNameParts.join(' ') || firstName || 'Alıcı',
        gsmNumber: '5000000000',
        email: customerEmail,
        identityNumber: '00000000000',
        lastLoginDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
        registrationAddress: 'Ankara',
        ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
        city: 'Ankara',
        country: 'Turkey',
        zipCode: '06100',
      },

      // Billing & Shipping address
      billingAddress: {
        contactName: customerName,
        city: 'Ankara',
        country: 'Turkey',
        address: 'Ankara',
        zipCode: '06100',
      },

      shippingAddress: {
        contactName: customerName,
        city: 'Ankara',
        country: 'Turkey',
        address: 'Ankara',
        zipCode: '06100',
      },

      // Basket items
      basketItems: [
        {
          id: orderId,
          name: `Sipariş #${orderNumber}`,
          category1: 'Sosyal Girişim',
          itemType: 'PHYSICAL',
          price: totalAmount.toFixed(2),
        },
      ],
    };

    // Serialize request body for signature
    const requestString = JSON.stringify(requestBody);
    const signature = generateSignature(requestString, secretKey);

    // Call Iyzico REST API (Production)
    const apiBaseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.iyzipay.com/v2/checkoutform/initialize'
      : 'https://sandbox-api.iyzipay.com/v2/checkoutform/initialize';

    const response = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`,
        'X-IYZIPAY-REQUEST-SIGNATURE': signature,
      },
      body: requestString,
    });

    const responseText = await response.text();

    console.log('Iyzico Response Status:', response.status);
    console.log('Iyzico Response Body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse JSON. Raw response:', responseText);
      return NextResponse.json(
        { error: 'Iyzico API yanıt hatası' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Iyzico API Error:', result);
      return NextResponse.json(
        { error: result.errorMessage || 'Ödeme formu oluşturulamadı' },
        { status: response.status }
      );
    }

    if (!result?.checkoutFormContent) {
      return NextResponse.json(
        { error: 'Ödeme formu oluşturulamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutFormContent: result.checkoutFormContent,
      orderId,
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Ödeme işlemi başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}
