import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo';

/** Sitenin kanonik alan adı (SITE_URL'den türetiliyor). */
const KANONIK_HOST = new URL(SITE_URL).host;

function kanonikOlmayanHost(host: string | null): boolean {
  if (!host) return false;
  const temiz = host.split(':')[0];
  if (temiz === 'localhost' || temiz === '127.0.0.1') return false;
  return temiz !== KANONIK_HOST;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin Koruması (/admin/login ve /admin/logout hariç)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/logout') {
    const cookieToken = req.cookies.get('admin-token')?.value;

    const headerCookies = req.headers.get('cookie') || '';
    const rawCookieToken = headerCookies
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('admin-token='))
      ?.split('=')[1];

    const token = cookieToken || rawCookieToken;

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      const res = NextResponse.redirect(loginUrl);
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      return res;
    }
  }

  const res = NextResponse.next();

  // Admin sayfaları, alt klasörleri ve API'lerde arama motoru/AI indeksini ve önbelleğini kesin olarak devre dışı bırak
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    res.headers.set('Surrogate-Control', 'no-store');
  }

  if (kanonikOlmayanHost(req.headers.get('host'))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|logo.webp|og-gorsel.jpg|llms.txt|robots.txt|sitemap.xml|video/|hero/|kategori/).*)'],
};
