import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * Yönetici oturum imza anahtarı.
 * Ortamda JWT_SECRET veya NEXTAUTH_SECRET tanımlıysa onu kullanır,
 * tanımlı değilse güvenli sabit üretim anahtarına başvurur (erişim kilitlenmesini önler).
 */
export const GUVENLI_ADMIN_JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'isyurtlari-2026-prod-jwt-secret-9f8a7b6c5d4e3f2a1';

export function jwtAnahtari(): string {
  return GUVENLI_ADMIN_JWT_SECRET;
}

/**
 * Yetkili Yönetici E-Posta Listesi
 */
export const YETKILI_ADMIN_EMAILLER: string[] = [
  (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
  'halil.kosger@gmail.com',
  'tahaberke0312@gmail.com',
  'info@isyurtlari.com.tr',
].filter(Boolean);

export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  return YETKILI_ADMIN_EMAILLER.includes(email.toLowerCase().trim());
}

/**
 * /api/admin/* uçlarında admin oturumunu doğrular.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return false;

  const anahtar = jwtAnahtari();
  try {
    const payload = jwt.verify(token, anahtar);
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

  const anahtar = jwtAnahtari();
  try {
    const payload = jwt.verify(token, anahtar);
    if (typeof payload !== 'object' || payload === null) return null;
    const eposta = (payload as { email?: unknown }).email;
    return typeof eposta === 'string' && eposta ? eposta : null;
  } catch {
    return null;
  }
}
