import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyOTP, getRemainingAttempts, kodlariTemizle } from '@/lib/otp';
import { logAudit } from '@/lib/audit-log';
import { hizSiniriGuard } from '@/lib/hiz-siniri';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'halil.kosger@gmail.com';

export async function POST(req: NextRequest) {
  let email = 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  try {
    const body = await req.json();
    email = body.email;
    const code = body.code;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email ve kod gereklidir' },
        { status: 400 }
      );
    }

    // Hiz siniri: dakikada 10 dogrulama denemesi.
    //
    // Kodun kendi deneme sayaci (5) tek bir kod icin gecerli; bu sinir ise
    // surekli yeni kod isteyip denemeyi de yavaslatiyor. Sayac veritabaninda
    // oldugu icin sunucusuz ortamda gercekten isliyor.
    const sinir = await hizSiniriGuard(req, 'otp-verify', 10, 60);
    if (sinir) {
      await logAudit('OTP_VERIFY', email, 'failed', 'Hız sınırı aşıldı', ip);
      return sinir;
    }

    if (email !== ADMIN_EMAIL) {
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

    // Create JWT token
    const token = jwt.sign(
      { admin: true, email, iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set secure cookie
    const res = NextResponse.json({ success: true });
    res.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 saat
      path: '/',
    });

    await logAudit('OTP_VERIFY', email, 'success', 'Yönetici girişi başarılı', ip);

    // Suresi gecmis kodlari ara sira temizle
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
