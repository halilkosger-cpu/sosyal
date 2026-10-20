import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyOTP, getRemainingAttempts, kodlariTemizle, normalizeEmail, normalizeCode } from '@/lib/otp';
import { logAudit } from '@/lib/audit-log';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { jwtAnahtari } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let email = 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    const body = await req.json();
    email = normalizeEmail(body.email);
    const code = normalizeCode(body.code);

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-posta ve 6 haneli doğrulama kodu gereklidir' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: 'Doğrulama kodu 6 haneli bir sayı olmalıdır' },
        { status: 400 }
      );
    }

    // Hız sınırı: dakikada en fazla 6 deneme
    const sinir = await hizSiniriGuard(req, 'otp-verify', 6, 60);
    if (sinir) {
      await logAudit('OTP_VERIFY', email, 'failed', 'Hız sınırı aşıldı', ip);
      return sinir;
    }

    const ADMIN_EMAILS = [
      (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      'info@isyurtlari.com.tr',
      'halil.kosger@gmail.com',
    ].filter(Boolean);

    if (!ADMIN_EMAILS.includes(email)) {
      await logAudit('OTP_VERIFY', email, 'failed', 'Yetkisiz e-posta ile kod onayı', ip);
      return NextResponse.json({ error: 'Yetkisiz e-posta adresi.' }, { status: 403 });
    }

    // OTP Doğrula
    const isValid = await verifyOTP(email, code);

    if (!isValid) {
      const remaining = await getRemainingAttempts(email);
      await logAudit('OTP_VERIFY', email, 'failed', `Hatalı kod. Kalan deneme: ${remaining}`, ip);

      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'Maksimum deneme sayısı (5) aşıldı. Lütfen yeni bir kod talep ediniz.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Hatalı veya süresi dolmuş kod. Kalan hakkınız: ${remaining}` },
        { status: 401 }
      );
    }

    // Doğrulama başarılı - Yönetici JWT jetonunu imzala (7 gün)
    const token = jwt.sign(
      { admin: true, email, iat: Math.floor(Date.now() / 1000) },
      jwtAnahtari(),
      { expiresIn: '7d' }
    );

    const res = NextResponse.json({
      success: true,
      token,
      redirect: '/admin',
      message: 'Kimlik doğrulama başarılı',
    });

    // Çerezi hem istemci hem sunucu navigasyonunda kesintisiz çalışacak şekilde set et
    res.cookies.set('admin-token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 gün boyunca geçerli
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    await logAudit('OTP_VERIFY', email, 'success', 'Yönetici 2FA OTP ile başarıyla oturum açtı', ip);

    // Arka planda süresi geçmiş kodları temizle
    await kodlariTemizle();

    return res;
  } catch (error) {
    console.error('OTP verification error:', error);
    await logAudit('OTP_VERIFY', email, 'failed', String(error), ip);
    return NextResponse.json(
      { error: 'Doğrulama işlemi sırasında sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
