import type { NextResponse } from 'next/server';

// Cache disabled to show latest products immediately
export function vitrinOnbellegi<T extends NextResponse>(yanit: T, saniye = 0): T {
  if (yanit.status === 200) {
    yanit.headers.set('Cache-Control', `no-cache, no-store, must-revalidate`);
  }
  return yanit;
}
