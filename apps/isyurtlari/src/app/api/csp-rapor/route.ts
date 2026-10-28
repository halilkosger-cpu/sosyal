import { NextRequest, NextResponse } from 'next/server';
import { hizSiniriGuard } from '@/lib/hiz-siniri';

export const dynamic = 'force-dynamic';

// Tarayicilarin CSP ihlal bildirimleri Vercel kayitlarina kisaltilmis olarak yazilir.
export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'csp-rapor', 30, 60);
  if (sinir) return new NextResponse(null, { status: 204 });
  try {
    const metin = (await req.text()).slice(0, 4000);
    const govde = JSON.parse(metin);
    const r = govde['csp-report'] ?? govde?.[0]?.body ?? govde;
    console.warn('CSP ihlali', {
      direktif: String(r?.['violated-directive'] ?? r?.effectiveDirective ?? '').slice(0, 80),
      engellenen: String(r?.['blocked-uri'] ?? r?.blockedURL ?? '').slice(0, 200),
      sayfa: String(r?.['document-uri'] ?? r?.documentURL ?? '').slice(0, 200),
    });
  } catch {
    // Bozuk bildirim yok sayilir.
  }
  return new NextResponse(null, { status: 204 });
}
