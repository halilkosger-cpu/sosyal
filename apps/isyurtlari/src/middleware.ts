import { NextRequest, NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/seo';

/** Sitenin kanonik alan adi (SITE_URL'den turetiliyor). */
const KANONIK_HOST = new URL(SITE_URL).host;

/**
 * Kanonik olmayan alan adlarindan gelen istekleri arama motorlarina
 * kapatir.
 *
 * Site yalnizca isyurtlari.com.tr uzerinden degil,
 * sosyal-isyurtlari.vercel.app ve her preview dagitiminin kendi adresi
 * uzerinden de 200 ile servis ediliyordu; hepsi "index, follow" diyordu.
 * Bu, ayni icerigin birden fazla adreste indekslenmesi riski demek.
 * Canonical etiketi cogu durumda yeter ama zayif bir korumadir; basligi
 * eklemek kesin sonuc verir.
 *
 * Yerel gelistirme (localhost) etkilenmiyor.
 */
function kanonikOlmayanHost(host: string | null): boolean {
  if (!host) return false;
  const temiz = host.split(':')[0];
  if (temiz === 'localhost' || temiz === '127.0.0.1') return false;
  return temiz !== KANONIK_HOST;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  const res = NextResponse.next();

  if (kanonikOlmayanHost(req.headers.get('host'))) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return res;
}

export const config = {
  // Statik dosyalar disinda her istekte calisir: host kontrolu tum sayfalari
  // kapsamali, yalnizca /admin'i degil.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg|logo.webp|video/).*)'],
};
