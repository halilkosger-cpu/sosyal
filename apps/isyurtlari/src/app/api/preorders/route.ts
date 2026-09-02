import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailTemplates } from '@/lib/email-templates';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

const hasDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  return url?.startsWith('postgresql://') || url?.startsWith('postgres://');
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_QUANTITY = 500;
// En az 10 rakam; bosluk, parantez, tire ve +90 gibi yazimlara izin verir
const PHONE_RE = /^[+()\d\s-]{10,20}$/;

export async function POST(req: NextRequest) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json({ error: 'Servis şu anda kullanılamıyor' }, { status: 503 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    const body = await req.json();
    const productId = String(body.productId || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const note = String(body.note || '').trim();
    const quantity = Number(body.quantity);

    // ─── Doğrulama ───
    if (!productId || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Ad, e-posta, cep telefonu ve ürün bilgisi zorunludur' },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!PHONE_RE.test(phone) || phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Geçerli bir cep telefonu girin (örn. 05XX XXX XX XX)' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return NextResponse.json(
        { error: `Adet 1 ile ${MAX_QUANTITY} arasında olmalıdır` },
        { status: 400 }
      );
    }

    // Rate limiting: aynı IP'den dakikada en fazla 5 ön talep
    const rateLimit = checkRateLimit(`preorder:${ip}`, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.' },
        { status: 429 }
      );
    }

    // ─── Ürün kontrolü ───
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true, quantity: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    if (product.quantity > 0) {
      return NextResponse.json(
        { error: 'Bu ürün şu anda stokta. Doğrudan sepete ekleyebilirsiniz.' },
        { status: 409 }
      );
    }

    // ─── Kayıt: aynı kişi aynı ürüne tekrar talep verirse adedi güncelle ───
    const existing = await prisma.preOrder.findFirst({
      where: { productId, email, status: 'WAITING' },
      select: { id: true },
    });

    const preOrder = existing
      ? await prisma.preOrder.update({
          where: { id: existing.id },
          data: { quantity, name, phone, note: note || null },
        })
      : await prisma.preOrder.create({
          data: {
            productId,
            quantity,
            name,
            email,
            phone,
            note: note || null,
          },
        });

    // ─── E-postalar (başarısızlık ön talebi iptal etmemeli) ───
    const productUrl = `https://www.isyurtlari.com.tr/urun/${product.slug}`;

    try {
      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: email,
        subject: `Ön talebiniz alındı - ${product.name}`,
        html: emailTemplates.preOrderConfirmation({
          name,
          productName: product.name,
          quantity,
          productUrl,
        }),
      });

      await resend.emails.send({
        from: 'info@isyurtlari.com.tr',
        to: process.env.EMAIL_RECIPIENT || 'info@isyurtlari.com.tr',
        subject: `Yeni ön talep - ${product.name} (${quantity} adet)`,
        html: `
          <h3>${existing ? 'Güncellenen' : 'Yeni'} Ön Talep</h3>
          <p><strong>Ürün:</strong> ${product.name}</p>
          <p><strong>Adet:</strong> ${quantity}</p>
          <p><strong>Ad:</strong> ${name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
          ${note ? `<p><strong>Not:</strong><br>${note.replace(/\n/g, '<br>')}</p>` : ''}
          <p style="color:#888;font-size:12px;">Admin panelinden tüm ön talepleri görüntüleyebilirsiniz.</p>
        `,
      });
    } catch (mailError) {
      console.error('Ön talep e-postası gönderilemedi:', mailError);
    }

    return NextResponse.json(
      { success: true, id: preOrder.id, updated: Boolean(existing) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ön talep oluşturma hatası:', error);
    return NextResponse.json({ error: 'Ön talep kaydedilemedi' }, { status: 500 });
  }
}
