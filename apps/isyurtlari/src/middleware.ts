import { NextRequest, NextResponse } from 'next/server';
import { adminTokenGecerliMi } from '@/lib/admin-jwt-edge';

/**
 * Yalnizca /admin altinda calisir (bkz. config.matcher).
 *
 * Onceden her sayfa istegi middleware'den geciyordu; bu, bot taramalari ve
 * link onyuklemeleriyle birlikte Vercel fonksiyon cagrisi kotasini
 * tuketiyordu. noindex basliklari artik next.config.js'te (ucretsiz,
 * statik) tanimli; burada sadece kimlik dogrulama kaldi.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login ve /admin/logout haric: imzali ve suresi dolmamis JWT sart.
  // Yetkisiz istekler giris sayfasina yonlendirilmez; 404 doner (yolun varligi sizmaz).
  if (pathname !== '/admin/login' && pathname !== '/admin/logout') {
    if (!(await adminTokenGecerliMi(req.cookies.get('admin-token')?.value))) {
      const res = NextResponse.rewrite(new URL('/404', req.url), { status: 404 });
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
