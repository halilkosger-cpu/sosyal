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
  const { pathname, searchParams } = req.nextUrl;
  const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https://');

  // Admin Koruması
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // 1. Çerezden oku
    const cookieToken = req.cookies.get('admin-token')?.value;

    // 2. Cookie başlığından oku (fallback)
    const headerCookies = req.headers.get('cookie') || '';
    const rawCookieToken = headerCookies
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('admin-token='))
      ?.split('=')[1];

    // 3. URL Session Parametresi (SSO / 2FA redirection fallback)
    const urlSessionToken = searchParams.get('session');

    const token = cookieToken || rawCookieToken || urlSessionToken;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // Eğer URL'den session token ile gelindiyse, çerezi set edip URL'i temizle
    if (urlSessionToken) {
      const cleanUrl = new URL(pathname, req.url);
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set('admin-token', urlSessionToken, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });
      return res;
    }
  }

  const res = NextResponse.next();

  if (kanonikOlmayanHost(req.headers.get('host'))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|logo.webp|og-gorsel.jpg|llms.txt|robots.txt|sitemap.xml|video/|hero/|kategori/).*)'],
};
