import { NextResponse } from 'next/server';
import { oturumKapat } from '@/lib/musteri-auth';

export const dynamic = 'force-dynamic';

/**
 * Cikis. Yalnizca POST kabul ediyor.
 *
 * GET ile cikis yaptirilsaydi, baska bir sitedeki bir <img> etiketi
 * kullaniciyi habersizce cikartabilirdi.
 */
export async function POST() {
  await oturumKapat();
  return NextResponse.json({ ok: true });
}
