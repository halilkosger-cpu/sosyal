import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function jwtAnahtari(): string {
  const anahtar = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (anahtar) return anahtar;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET tanımlı değil');
  }
  return 'yalnizca-yerel-gelistirme-anahtari';
}

const eposta = (s: string) => s.toLowerCase().trim();

/**
 * Yetkili yönetici e-posta listesi: yalnızca ortam değişkenlerinden okunur
 * (`ADMIN_EMAIL` ve virgülle ayrılmış `ADMIN_EMAILS`). İkisi de boşsa kimse
 * yetkili değildir; koda gömülü yedek liste yoktur.
 */
export function yetkiliAdminEpostalari(env: Record<string, string | undefined> = process.env): string[] {
  const tekil = eposta(env.ADMIN_EMAIL || '');
  const ortamListesi = (env.ADMIN_EMAILS || '').split(',').map(eposta);
  return [...new Set([tekil, ...ortamListesi].filter(Boolean))];
}

export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  return yetkiliAdminEpostalari().includes(eposta(email));
}

/**
 * /api/admin/* uçlarında admin oturumunu doğrular.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return false;

  try {
    const payload = jwt.verify(token, jwtAnahtari());
    return typeof payload === 'object' && payload !== null && (payload as any).admin === true;
  } catch {
    return false;
  }
}

/** Yetkisiz istekler için ortak 401 yanıtı. */
export function yetkisiz() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
}

/**
 * Korumalı admin uçlarının başında çağrılır.
 */
export function adminGuard(req: NextRequest) {
  return isAdminRequest(req) ? null : yetkisiz();
}

/**
 * Oturumdaki yöneticinin e-postası.
 */
export function adminEpostasi(req: NextRequest): string | null {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, jwtAnahtari());
    if (typeof payload !== 'object' || payload === null) return null;
    const eposta = (payload as { email?: unknown }).email;
    return typeof eposta === 'string' && eposta ? eposta : null;
  } catch {
    return null;
  }
}
