import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateOTP, storeOTP } from '@/lib/otp';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit-log';

const resend = new Resend(process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (!email) {
      return NextResponse.json({ error: 'Email gereklidir' }, { status: 400 });
    }

    // Validate email (should be admin email)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'halil.kosger@gmail.com';
    if (email !== ADMIN_EMAIL) {
      logAudit('OTP_REQUEST', email, 'failed', 'Unauthorized email', ip);
      return NextResponse.json({ error: 'Yetkisiz email' }, { status: 403 });
    }

    // Rate limiting: 5 requests per minute per email
    const rateLimit = checkRateLimit(`otp-request:${email}`, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      logAudit('OTP_REQUEST', email, 'failed', 'Rate limit exceeded', ip);
      return NextResponse.json(
        { error: 'Çok fazla istek. Lütfen 1 dakika bekleyin.' },
        { status: 429 }
      );
    }

    // Generate OTP
    const code = generateOTP();
    storeOTP(email, code);

    console.log(`OTP for ${email}: ${code}`);

    // Send OTP email
    const result = await resend.emails.send({
      from: 'info@isyurtlari.com.tr',
      to: email,
      subject: 'Admin Paneli Giriş Kodu - isyurtlari.com.tr',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6000;">Admin Paneli Giriş Kodu</h2>
          <p>Merhaba,</p>
          <p>Admin paneline giriş yapmak için aşağıdaki kodu kullanınız:</p>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #FF6000; margin: 0;">
              ${code}
            </p>
            <p style="color: #666; margin-top: 10px;">Bu kod 10 dakika geçerlidir.</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Eğer bu işlemi yapmadıysanız, lütfen bu emaili dikkate almayınız.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            isyurtlari.com.tr © 2024. Tüm hakları saklıdır.
          </p>
        </div>
      `,
    });

    if (result.error) {
      console.error('Email sending error:', result.error);
      logAudit('OTP_REQUEST', email, 'failed', 'Email sending failed', ip);
      return NextResponse.json(
        { error: 'Email gönderme başarısız' },
        { status: 500 }
      );
    }

    logAudit('OTP_REQUEST', email, 'success', `OTP sent`, ip);

    return NextResponse.json({
      success: true,
      message: 'Giriş kodu email adresinize gönderilmiştir',
    });
  } catch (error) {
    console.error('OTP request error:', error);
    logAudit('OTP_REQUEST', email || 'unknown', 'failed', String(error), ip);
    return NextResponse.json(
      { error: 'Giriş kodu gönderme başarısız' },
      { status: 500 }
    );
  }
}
