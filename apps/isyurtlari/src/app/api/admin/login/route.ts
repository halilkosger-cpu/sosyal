import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { jwtAnahtari } from '@/lib/admin-auth';
import { hizSiniriGuard } from '@/lib/hiz-siniri';
import { logAudit } from '@/lib/audit-log';

/**
 * Yönetici Şifresi ile Hızlı Giriş (POST)
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  // Hız sınırı: dakikada en fazla 5 şifre denemesi
  const sinir = await hizSiniriGuard(req, 'admin-login-pwd', 5, 60);
  if (sinir) {
    return sinir;
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gereklidir' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ALLOWED_EMAILS = [
      (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      'halil.kosger@gmail.com',
      'info@isyurtlari.com.tr'
    ].filter(Boolean);

    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      await logAudit('ADMIN_PASSWORD_LOGIN', normalizedEmail, 'failed', 'Yetkisiz e-posta', ip);
      return NextResponse.json({ error: 'Yetkisiz email adresi' }, { status: 403 });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD || 'isyurtlari2026!';
    if (password !== expectedPassword) {
      await logAudit('ADMIN_PASSWORD_LOGIN', normalizedEmail, 'failed', 'Hatalı şifre', ip);
      return NextResponse.json({ error: 'Geçersiz şifre' }, { status: 401 });
    }

    // Token üret (24 saat)
    const token = jwt.sign(
      { admin: true, email: normalizedEmail },
      jwtAnahtari(),
      { expiresIn: '24h' }
    );

    await logAudit('ADMIN_PASSWORD_LOGIN', normalizedEmail, 'success', 'Şifreyle giriş başarılı', ip);

    const res = NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
    });

    res.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 saat
    });

    return res;
  } catch (err: any) {
    console.error('Admin password login error:', err);
    return NextResponse.json({ error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}

/**
 * Yönetici oturumunu kapatır (DELETE)
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('admin-token');
  return res;
}
