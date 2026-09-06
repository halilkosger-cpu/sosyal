import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { adminGuard } from '@/lib/admin-auth';
import { denetimIslemleri } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/**
 * Denetim günlüğü okuma ucu.
 *
 * Kayıtlar artık veritabanında (bkz. lib/audit-log.ts). İki değişiklik:
 *
 *  - Sıralama veritabanında yapılıyor; eski kod bellekteki diziyi sona
 *    doğru dilimleyip `reverse()` ediyordu. Artık sorgu zaten en yeniden
 *    eskiye geliyor, tersine çevirmek sıralamayı bozardı.
 *  - Sayfalama ve işlem koduna göre süzgeç eklendi: tablo zamanla
 *    büyüyecek, tek seferde 100 satır göstermek yetmez.
 */

const AZAMI_ADET = 200;

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const p = req.nextUrl.searchParams;
    const eposta = p.get('email')?.trim() || undefined;
    const islem = p.get('islem')?.trim() || undefined;
    const durum = p.get('durum')?.trim();

    const adet = Math.min(AZAMI_ADET, Math.max(1, parseInt(p.get('limit') || '50', 10) || 50));
    const sayfa = Math.max(1, parseInt(p.get('sayfa') || '1', 10) || 1);

    const kosul = {
      ...(eposta ? { eposta } : {}),
      ...(islem ? { islem } : {}),
      ...(durum === 'success' || durum === 'failed' ? { durum } : {}),
    };

    const [kayitlar, toplam, islemler] = await Promise.all([
      prisma.denetimKaydi.findMany({
        where: kosul,
        orderBy: { olusturulma: 'desc' },
        skip: (sayfa - 1) * adet,
        take: adet,
        select: {
          id: true,
          islem: true,
          eposta: true,
          durum: true,
          ayrinti: true,
          ip: true,
          olusturulma: true,
        },
      }),
      prisma.denetimKaydi.count({ where: kosul }),
      denetimIslemleri(),
    ]);

    return NextResponse.json({
      success: true,
      count: kayitlar.length,
      toplam,
      sayfa,
      sayfaSayisi: Math.ceil(toplam / adet),
      islemler,
      // Eski alan adları korunuyor; bu ucu kullanan bir istemci varsa kırılmasın.
      logs: kayitlar.map((k) => ({
        id: k.id,
        timestamp: k.olusturulma.toISOString(),
        action: k.islem,
        email: k.eposta,
        status: k.durum,
        details: k.ayrinti ?? undefined,
        ip: k.ip ?? undefined,
      })),
    });
  } catch (error) {
    console.error('Denetim günlüğü okunamadı:', error);
    return NextResponse.json({ error: 'Denetim günlüğü getirilemedi' }, { status: 500 });
  }
}
