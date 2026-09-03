import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminGuard } from '@/lib/admin-auth';

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
  'PasswordResetToken', 'UserBadge', 'Announcement', 'SupportResource',
] as const;

/** Model adini Prisma istemcisindeki ozellik adina cevirir. */
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
    const satirlar = await prismaModeli(tablo).findMany({ skip: atla, take: adet });
    return NextResponse.json(
      { tablo, atla, adet: satirlar.length, satirlar },
      { headers: NO_CACHE }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Tablo okunamadi: ' + (e?.message || '').slice(0, 120) },
      { status: 500 }
    );
  }
}
