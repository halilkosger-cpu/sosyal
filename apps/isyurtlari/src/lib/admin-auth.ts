import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * /api/admin/* uçlarında admin oturumunu doğrular.
 *
 * middleware.ts yalnızca /admin/* sayfalarını koruyor; API uçları kapsam dışı.
 * Bu yüzden hassas API uçlarının kendi kontrolünü yapması gerekiyor.
 */
export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get('admin-token')?.value;
  if (!token) return false;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return typeof payload === 'object' && payload !== null && (payload as any).admin === true;
  } catch {
    return false;
  }
}

/** Yetkisiz istekler icin ortak 401 yaniti. */
export function yetkisiz() {
  return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
}

/**
 * Korumali admin uclarinin basinda cagrilir.
 * Yetki yoksa hazir 401 yanitini, varsa null dondurur:
 *
 *   const red = adminGuard(req);
 *   if (red) return red;
 */
export function adminGuard(req: NextRequest) {
  return isAdminRequest(req) ? null : yetkisiz();
}
