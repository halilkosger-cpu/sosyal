import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo';
import { adminTokenGecerliMi } from '@/lib/admin-jwt-edge';

/** Sitenin kanonik alan adı (SITE_URL'den türetiliyor). */
const KANONIK_HOST = new URL(SITE_URL).host;

function kanonikOlmayanHost(host: string | null): boolean {
  if (!host) return false;
  const temiz = host.split(':')[0];
  if (temiz === 'localhost' || temiz === '127.0.0.1') return false;
  return temiz !== KANONIK_HOST;
}

const OZEL_YOLLAR = ['/hesabim', '/adreslerim', '/siparislerim', '/iadelerim', '/checkout', '/sepet', '/favoriler', '/order-confirmation', '/yorum', '/giris', '/kayit', '/sifre-sifirla', '/eposta-dogrula', '/ara'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin Koruması (/admin/login ve /admin/logout hariç): imzalı ve süresi dolmamış JWT şart.
  // Yetkisiz istekler giriş sayfasına yönlendirilmez; 404 döner (yolun varlığı sızmaz).
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/logout') {
    if (!(await adminTokenGecerliMi(req.cookies.get('admin-token')?.value))) {
      const res = NextResponse.rewrite(new URL('/404', req.url), { status: 404 });
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

  // Kisiye ozel/islem sayfalari: robots.txt'te listelemeden noindex ile gizle
  if (OZEL_YOLLAR.some((y) => pathname === y || pathname.startsWith(y + '/'))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  if (kanonikOlmayanHost(req.headers.get('host'))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|logo.webp|og-gorsel.jpg|llms.txt|robots.txt|sitemap.xml|google-merchant.xml|video/|hero/|kategori/|hikaye/|urun/).*)'],
};
