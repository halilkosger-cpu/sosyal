import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateOTP, storeOTP, normalizeEmail } from '@/lib/otp';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { logAudit } from '@/lib/audit-log';

const resendApiKey = process.env.SEND_MAIL_API_KEY || process.env.RESEND_API_KEY || 're_mock_key';
const resend = new Resend(resendApiKey);

export async function POST(req: NextRequest) {
  let email = 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    const body = await req.json();
    email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi gereklidir' }, { status: 400 });
    }

    // Yetkili yönetici e-posta kontrolü
    const ALLOWED_EMAILS = [
      (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      'halil.kosger@gmail.com',
      'info@isyurtlari.com.tr',
    ].filter(Boolean);

    if (!ALLOWED_EMAILS.includes(email)) {
      await logAudit('OTP_REQUEST', email, 'failed', 'Yetkisiz e-posta ile kod talebi', ip);
      return NextResponse.json({ error: 'Yetkisiz e-posta adresi.' }, { status: 403 });
    }

    // Hız sınırı: dakikada en fazla 4 kod isteği
    const sinir = await hizSiniriGuard(req, 'otp-request', 4, 60);
    if (sinir) {
      await logAudit('OTP_REQUEST', email, 'failed', 'Hız sınırı aşıldı', ip);
      return sinir;
    }

    // Kriptografik güvenli kod üret ve SHA-256 ile veritabanına kaydet
    const code = generateOTP();
    await storeOTP(email, code);

    // E-posta gönderimi
    const result = await resend.emails.send({
      from: 'info@isyurtlari.com.tr',
      to: email,
      subject: 'Admin Paneli Giriş Doğrulama Kodu - isyurtlari.com.tr',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #0F2040; padding: 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">İşyurtları Yönetim Paneli</h2>
            <p style="color: #93c5fd; margin: 6px 0 0 0; font-size: 13px;">Tek Kullanımlık Güvenli Giriş Kodu</p>
          </div>
          <div style="padding: 28px;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 16px 0;">Merhaba,</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
              Yönetim paneline giriş yapabilmeniz için tek kullanımlık güvenlik kodunuz aşağıdadır:
            </p>
            <div style="background: #FFF7ED; border: 2px dashed #EA580C; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #EA580C; font-family: monospace;">
                ${code}
              </span>
              <p style="color: #9a3412; font-size: 12px; margin: 10px 0 0 0; font-weight: 600;">
                Bu kod 15 dakika boyunca geçerlidir.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.4; margin: 20px 0 0 0;">
              Bu giriş talebini siz gerçekleştirmediyseniz bu iletiyi görmezden gelebilirsiniz. Kodunuzu kimseyle paylaşmayınız.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 14px 28px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
              isyurtlari.com.tr © 2026. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error('Email sending error:', result.error);
      await logAudit('OTP_REQUEST', email, 'failed', `E-posta gönderilemedi: ${result.error.message}`, ip);
      return NextResponse.json(
        { error: 'Doğrulama kodu e-postası gönderilemedi. Lütfen daha sonra tekrar deneyiniz.' },
        { status: 500 }
      );
    }

    await logAudit('OTP_REQUEST', email, 'success', 'Giriş kodu gönderildi', ip);

    return NextResponse.json({
      success: true,
      message: '6 haneli giriş kodu e-posta adresinize gönderildi.',
    });
  } catch (error) {
    console.error('OTP request error:', error);
    await logAudit('OTP_REQUEST', email, 'failed', String(error), ip);
    return NextResponse.json(
      { error: 'Giriş kodu talebi işlenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
