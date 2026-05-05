import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { emailTemplates } from '@/lib/email-templates';

const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
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
      subject: `Yeni İletişim - ${name}`,
      html: `
        <h3>Yeni İletişim Formu</h3>
        <p><strong>Ad:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
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
