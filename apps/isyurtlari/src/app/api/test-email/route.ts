import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail } = await request.json();

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail zorunludur' },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: 'info@isyurtlari.com.tr',
      to: recipientEmail,
      subject: '🎉 isyurtlari.com.tr Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h1 style="color: #333;">Merhaba! 👋</h1>
          <p>Bu, isyurtlari.com.tr'dan test bir emaildir.</p>
          <p>Email sisteminiz başarıyla çalışıyor!</p>

          <hr style="border: none; border-top: 2px solid #eee; margin: 20px 0;" />

          <h2 style="color: #666;">Test Bilgileri:</h2>
          <ul>
            <li><strong>Gönderen:</strong> info@isyurtlari.com.tr</li>
            <li><strong>Alıcı:</strong> ${recipientEmail}</li>
            <li><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</li>
          </ul>

          <hr style="border: none; border-top: 2px solid #eee; margin: 20px 0;" />

          <p style="color: #999; font-size: 12px;">
            Bu email Resend.com üzerinden gönderilmiştir.
          </p>
        </div>
      `,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Test email başarıyla gönderildi!',
        emailId: result.data?.id,
        recipient: recipientEmail
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Email gönderme başarısız oldu', details: String(error) },
      { status: 500 }
    );
  }
}
