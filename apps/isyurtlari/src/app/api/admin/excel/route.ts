import { prisma } from '@isyurtlari/database';
import { NextRequest, NextResponse } from 'next/server';
import { adminEpostasi, adminGuard } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';
import { excelDosyasi, excelYaniti } from '@/lib/excel';
import { onTalepTablosu, sepetTablosu, siparisTablosu, type Tablo } from '@/lib/admin-excel';
import { terkEdilmisSepetleriListele } from '@/lib/terk-edilmis-sepet-listesi';

export const dynamic = 'force-dynamic';

const TURLER = {
  siparisler: async (): Promise<Tablo> =>
    siparisTablosu(
      await prisma.order.findMany({
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: { select: { quantity: true, product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      })
    ),
  'on-talepler': async (): Promise<Tablo> =>
    onTalepTablosu(
      await prisma.preOrder.findMany({
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ),
  'terk-edilmis-sepetler': async (): Promise<Tablo> =>
    sepetTablosu((await terkEdilmisSepetleriListele(5000)).sepetler),
} as const;

type Tur = keyof typeof TURLER;
const turMu = (t: string | null): t is Tur => t !== null && Object.prototype.hasOwnProperty.call(TURLER, t);

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  const tur = req.nextUrl.searchParams.get('tur');
  if (!turMu(tur)) {
    return NextResponse.json({ error: 'Geçersiz liste türü' }, { status: 400 });
  }

  try {
    const tablo = await TURLER[tur]();
    const dosya = await excelDosyasi(tablo.sayfaAdi, tablo.sutunlar, tablo.satirlar);

    // Kisisel veri iceren toplu disa aktarim: kimin ne zaman aldigi kayit altinda.
    await logAudit(
      'EXCEL_EXPORT',
      adminEpostasi(req) || 'bilinmiyor',
      'success',
      `${tur} satir=${tablo.satirlar.length}`,
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    );

    const tarih = new Date().toISOString().slice(0, 10);
    return excelYaniti(dosya, `${tur}_${tarih}.xlsx`);
  } catch (error) {
    console.error('Excel dışa aktarma hatası:', { tur, error });
    return NextResponse.json({ error: 'Dosya oluşturulamadı' }, { status: 500 });
  }
}
