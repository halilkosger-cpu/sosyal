import { prisma } from '@isyurtlari/database';
import { absoluteUrl } from '@/lib/seo';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailTemplates } from '@/lib/email-templates';
import { hizSiniriGuard, sayaclariTemizle } from '@/lib/hiz-siniri';

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

  // Istemci adresi artik hizSiniriGuard icinde okunuyor.

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

    // Hiz siniri: ayni adresten dakikada en fazla 5 on talep.
    // Sayac veritabaninda; bellekteki sayac sunucusuz ortamda her istek ayri
    // ornekte islenebildigi icin surekli sifirlaniyordu.
    const sinir = await hizSiniriGuard(req, 'on-talep', 5, 60);
    if (sinir) return sinir;

    // Suresi gecmis sayac satirlarini ara sira temizle; tablo sinirsiz
    // buyumesin.
    await sayaclariTemizle();

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

    /**
     * ─── AYNI KISI AYNI URUNE TEKRAR TALEP VERIRSE ────────────────────
     *
     * Bu uc kimlik dogrulamiyor; "kim" sorusunun tek cevabi govdedeki
     * e-posta. Eskiden mevcut kayit bulununca ad, telefon, adet ve not
     * alanlarinin hepsi ustune yaziliyordu. Iki sonucu vardi:
     *
     *  1. Veri bozma. Bir baskasinin e-postasini yazan biri, o kisinin
     *     kayitli ad ve telefonunu degistirebiliyordu; yonetim paneli ve
     *     stok planlama ozeti bundan sonra saldirganin yazdigi iletisim
     *     bilgisini gosterirdi.
     *  2. Varlik sorgulama. Yanittaki `updated: true`, o e-postanin TAM
     *     OLARAK o urune bekleyen bir talebi oldugunu kanitliyordu. Urun
     *     kimlikleri herkese acik donuyor; bir adres listesiyle "kim
     *     neye talep vermis" haritasi cikarilabilirdi.
     *
     * Artik mevcut kayitta yalnizca ADET guncelleniyor ve yalnizca
     * BUYUYORSA. Ad, telefon ve not ilk kaydedildigi gibi kaliyor -
     * dogru bilgiyi ilk yazan, kaydi gercekten kendi acan kisidir.
     * Yanit da her iki durumda ayni; disaridan ayirt edilemiyor.
     */
    const existing = await prisma.preOrder.findFirst({
      where: { productId, email, status: 'WAITING' },
      select: { id: true, quantity: true },
    });

    const preOrder = existing
      ? await prisma.preOrder.update({
          where: { id: existing.id },
          data: { quantity: Math.max(existing.quantity, quantity) },
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
    const productUrl = absoluteUrl(`/urun/${product.slug}`);

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
      // `updated` alani kaldirildi: bir e-postanin o urune talebi olup
      // olmadigini disariya soyluyordu (yukaridaki aciklama).
      { success: true, id: preOrder.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ön talep oluşturma hatası:', error);
    return NextResponse.json({ error: 'Ön talep kaydedilemedi' }, { status: 500 });
  }
}
