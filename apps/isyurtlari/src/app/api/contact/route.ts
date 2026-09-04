import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailTemplates } from '@/lib/email-templates';
import { hizSiniriGuard } from '@/lib/hiz-siniri';

const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

/**
 * Form alanlari bildirim e-postasina dogrudan gomuluyordu. Gonderen kisi
 * mesajin icine istedigi HTML'i - ornegin sahte bir bag - koyabiliyor ve
 * e-postayi okuyan yoneticiyi hedef alabiliyordu. Alanlar artik kacisli.
 */
const kacir = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export async function POST(request: NextRequest) {
  // Hiz siniri: ayni adresten saatte 5 mesaj. Bu uc her istekte e-posta
  // gonderiyor; sinirsiz birakildiginda posta kotasi tuketilebilir.
  const sinir = await hizSiniriGuard(request, 'iletisim', 5, 3600);
  if (sinir) return sinir;

  try {
    const { name, email, message, phone } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email ve message zorunludur' },
        { status: 400 }
      );
    }

    // Siteye yapılan iletişimi gönder
    await resend.emails.send({
      from: 'info@isyurtlari.com.tr',
      to: 'info@isyurtlari.com.tr',
      subject: `Yeni İletişim - ${kacir(name).slice(0, 80)}`,
      html: `
        <h3>Yeni İletişim Formu</h3>
        <p><strong>Ad:</strong> ${kacir(name)}</p>
        <p><strong>Email:</strong> ${kacir(email)}</p>
        ${phone ? `<p><strong>Telefon:</strong> ${kacir(phone)}</p>` : ''}
        <p><strong>Mesaj:</strong></p>
        <p>${kacir(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    // Müşteriye teşekkür emaili gönder
    const confirmationEmailHtml = emailTemplates.contactConfirmation({
      name,
      email,
    });

    await resend.emails.send({
      from: 'info@isyurtlari.com.tr',
      to: email,
      subject: 'İletişim formunuz alındı',
      html: confirmationEmailHtml,
    });

    return NextResponse.json(
      { success: true, message: 'Email başarıyla gönderildi' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Email gönderme başarısız oldu' },
      { status: 500 }
    );
  }
}
