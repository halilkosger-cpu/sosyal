import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyOTP, getRemainingAttempts, kodlariTemizle } from '@/lib/otp';
import { logAudit } from '@/lib/audit-log';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { jwtAnahtari } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let email = 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    const body = await req.json();
    email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod gereklidir' },
        { status: 400 }
      );
    }

    const sinir = await hizSiniriGuard(req, 'otp-verify', 10, 60);
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
      await logAudit('OTP_VERIFY', email, 'failed', 'Yetkisiz e-posta', ip);
      return NextResponse.json({ error: 'Yetkisiz email' }, { status: 403 });
    }

    // Verify OTP
    const isValid = await verifyOTP(email, code);

    if (!isValid) {
      const remaining = await getRemainingAttempts(email);
      await logAudit('OTP_VERIFY', email, 'failed', `Hatalı kod. Kalan deneme: ${remaining}`, ip);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: 'Maksimum deneme sayısı aşıldı. Lütfen yeni kod isteyin.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Hatalı kod. Kalan deneme: ${remaining}` },
        { status: 401 }
      );
    }

    // Create JWT token using common secure key
    const token = jwt.sign(
      { admin: true, email, iat: Math.floor(Date.now() / 1000) },
      jwtAnahtari(),
      { expiresIn: '24h' }
    );

    // Set secure cookie with 'lax' sameSite to prevent cookie dropping on client navigation
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 saat
      path: '/',
    });

    await logAudit('OTP_VERIFY', email, 'success', 'Yönetici girişi başarılı', ip);

    // Süresi geçmiş kodları ara sıra temizle
    await kodlariTemizle();

    return res;
  } catch (error) {
    console.error('OTP verification error:', error);
    await logAudit('OTP_VERIFY', email, 'failed', String(error), ip);
    return NextResponse.json(
      { error: 'Doğrulama başarısız' },
      { status: 500 }
    );
  }
}
