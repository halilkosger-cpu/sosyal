import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyAdminTotpOrBackup } from '@/lib/totp';
import { logAudit } from '@/lib/audit-log';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { jwtAnahtari, isAdminEmail } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let email = 'unknown';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https://');
  const host = req.headers.get('host') || '';
  const cookieDomain = host.includes('isyurtlari.com.tr') ? '.isyurtlari.com.tr' : undefined;

  try {
    const body = await req.json();
    email = String(body.email || '').toLowerCase().trim();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json({ error: 'E-posta ve doğrulama kodu gereklidir.' }, { status: 400 });
    }

    // Hız sınırı: dakikada en fazla 6 deneme
    const sinir = await hizSiniriGuard(req, 'totp-verify', 6, 60, true);
    if (sinir) {
      await logAudit('TOTP_VERIFY', email, 'failed', 'Hız sınırı aşıldı', ip);
      return sinir;
    }

    if (!isAdminEmail(email)) {
      await logAudit('TOTP_VERIFY', email, 'failed', 'Yetkisiz e-posta ile TOTP denemesi', ip);
      return NextResponse.json({ error: 'Yetkisiz e-posta adresi.' }, { status: 403 });
    }

    // TOTP veya Kurtarma Kodunu Doğrula
    const result = await verifyAdminTotpOrBackup(email, code);

    if (!result.success) {
      await logAudit('TOTP_VERIFY', email, 'failed', result.message || 'Hatalı Authenticator kodu', ip);
      return NextResponse.json(
        { error: result.message || 'Hatalı veya süresi dolmuş Authenticator kodu.' },
        { status: 401 }
      );
    }

    // Doğrulama başarılı - JWT üret
    const token = jwt.sign(
      {
        email,
        admin: true,
        role: 'SUPER_ADMIN',
        authMethod: result.method === 'backup' ? 'totp_backup' : 'google_authenticator',
        iat: Math.floor(Date.now() / 1000),
      },
      jwtAnahtari(),
      { expiresIn: '4h' }
    );

    await logAudit(
      'TOTP_VERIFY',
      email,
      'success',
      result.method === 'backup' ? 'Yedek kurtarma koduyla başarılı giriş' : 'Google Authenticator ile anında giriş',
      ip
    );

    const response = NextResponse.json({
      ok: true,
      method: result.method,
      message: result.message || 'Yönetici oturumu açıldı.',
    });

    // Hem host-only hem domain genelinde güvenli çerez mühürle
    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict' as const,
      maxAge: 4 * 60 * 60, // 4 saat
      path: '/',
    };

    response.cookies.set('admin-token', token, cookieOptions);
    if (cookieDomain) {
      response.cookies.set('admin-token', token, { ...cookieOptions, domain: cookieDomain });
    }

    return response;
  } catch (error: any) {
    console.error('TOTP doğrulama hatası:', error);
    await logAudit('TOTP_VERIFY', email, 'failed', error?.message || 'Sunucu hatası', ip);
    return NextResponse.json({ error: 'Doğrulama sırasında hata oluştu.' }, { status: 500 });
  }
}
