import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard, adminEpostasi } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

const NO_CACHE = { 'Cache-Control': 'no-store, max-age=0' };

/**
 * Veritabani yedegi.
 *
 * Neden gerekli: canli DATABASE_URL Vercel'de "Sensitive" oldugu icin disaridan
 * okunamiyor ve veritabani baska bir hesapta duruyor. Yani veriye yalnizca
 * uygulamanin kendisi erisebiliyor. Bu uc, veriyi uygulamaya doktururek disari
 * almayi sagliyor.
 *
 * Sema iki uygulama tarafindan paylasiliyor (isyurtlari + cezaevinden), bu
 * yuzden tum modeller kapsaniyor.
 *
 * Tablolar, iceri aktarirken yabanci anahtar kisitlarinin kirilmamasi icin
 * ebeveynden cocuga dogru siralandi.
 */
const TABLOLAR = [
  'User', 'ProductCategory', 'Product', 'Campaign', 'CampaignProduct',
  'Cart', 'CartItem', 'Payment', 'Order', 'OrderItem',
  'Review', 'Favorite', 'PreOrder',
  'Follow', 'Post', 'Comment', 'Like', 'Bookmark',
  'ForumTopic', 'ForumReply',
  'LegalQuestion', 'LegalAnswer', 'LegalComment',
  'Message', 'Report', 'Notification', 'DsSchedule', 'News',
  'UserBadge', 'Announcement', 'SupportResource',
] as const;

/** Model adini Prisma istemcisindeki ozellik adina cevirir. */
// Yedekte sifre ozetleri, jetonlar ve gizli anahtarlar disari verilmez.
const HASSAS_ALAN = /pass|sifre|hash|token|secret|gizli/i;
const hassasiAyikla = (satir: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(satir).filter(([k]) => !HASSAS_ALAN.test(k)));

const prismaModeli = (ad: string) => (prisma as any)[ad.charAt(0).toLowerCase() + ad.slice(1)];

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const tablo = req.nextUrl.searchParams.get('tablo');
  const atla = Number(req.nextUrl.searchParams.get('atla') || 0);
  const adet = Math.min(Number(req.nextUrl.searchParams.get('adet') || 500), 1000);

  // Tablo listesi ve satir sayilari
  if (!tablo) {
    const sayimlar: { tablo: string; satir: number }[] = [];
    for (const t of TABLOLAR) {
      try {
        sayimlar.push({ tablo: t, satir: await prismaModeli(t).count() });
      } catch {
        sayimlar.push({ tablo: t, satir: -1 }); // tablo yok / okunamadi
      }
    }
    return NextResponse.json(
      { tablolar: sayimlar, toplamSatir: sayimlar.reduce((a, s) => a + Math.max(0, s.satir), 0) },
      { headers: NO_CACHE }
    );
  }

  if (!TABLOLAR.includes(tablo as any)) {
    return NextResponse.json({ error: 'Bilinmeyen tablo' }, { status: 400 });
  }

  try {
    const satirlar = ((await prismaModeli(tablo).findMany({ skip: atla, take: adet })) as Record<string, unknown>[]).map(hassasiAyikla);
    await logAudit(
      'DB_EXPORT',
      adminEpostasi(req) || 'bilinmiyor',
      'success',
      `${tablo} atla=${atla} adet=${satirlar.length}`,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    );
    return NextResponse.json(
      { tablo, atla, adet: satirlar.length, satirlar },
      { headers: NO_CACHE }
    );
  } catch {
    return NextResponse.json(
      { error: 'Tablo okunamadi' },
      { status: 500 }
    );
  }
}
