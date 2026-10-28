import { NextResponse } from 'next/server';

/**
 * Yönetici oturumunu kapatır (DELETE)
 *
 * Güvenlik Politikası:
 * Şifre ile doğrudan giriş KESİNLİKLE KALDIRILMIŞTIR.
 * Yönetim paneline giriş yalnızca kriptografik 2FA OTP (Tek Kullanımlık Kod)
 * üzerinden yapılmaktadır.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin-token', '', { path: '/', maxAge: 0, httpOnly: true });
  res.cookies.set('admin-token', '', { path: '/', maxAge: 0, httpOnly: true, domain: '.isyurtlari.com.tr' });
  return res;
}
