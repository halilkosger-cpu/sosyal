import type { NextResponse } from 'next/server';

// Herkese acik okuma uclari CDN'de 5 dk tutulur: her ziyaret/bot veritabanini uyandirmasin.
export function vitrinOnbellegi<T extends NextResponse>(yanit: T, saniye = 300): T {
  if (yanit.status === 200) {
    yanit.headers.set('Cache-Control', `public, s-maxage=${saniye}, stale-while-revalidate=${saniye * 2}`);
  }
  return yanit;
}
