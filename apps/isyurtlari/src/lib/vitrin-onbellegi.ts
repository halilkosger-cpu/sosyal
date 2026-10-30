import type { NextResponse } from 'next/server';

// Cache disabled to show latest products immediately
export function vitrinOnbellegi<T extends NextResponse>(yanit: T): T {
  if (yanit.status === 200) {
    yanit.headers.set('Cache-Control', `no-cache, no-store, must-revalidate`);
  }
  return yanit;
}
