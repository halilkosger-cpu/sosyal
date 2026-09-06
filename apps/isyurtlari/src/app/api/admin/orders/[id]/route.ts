import { prisma } from '@isyurtlari/database';
import { adminGuard, adminEpostasi } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';
import { KARGO_FIRMALARI } from '@/lib/kargo';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GECERLI_DURUMLAR = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const GECERLI_FIRMALAR = new Set(KARGO_FIRMALARI.map((f) => f.kod));

/** Takip numaraları harf, rakam ve tire dışında bir şey içermiyor. */
const takipNoTemizle = (deger: unknown): string | null => {
  const t = String(deger ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
  return t ? t.slice(0, 60) : null;
};

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const govde = await req.json();
    const { status } = govde;

    /**
     * Durum eskiden hiç doğrulanmıyordu: gövdeye ne yazılırsa Prisma'ya o
     * gidiyordu. Geçersiz bir değer 500 veriyor, sipariş de yarı yolda
     * kalıyordu.
     */
    if (status !== undefined && !GECERLI_DURUMLAR.includes(status)) {
      return NextResponse.json({ error: 'Geçersiz sipariş durumu' }, { status: 400 });
    }

    const kargoFirmasiIstendi = govde.kargoFirmasi !== undefined;
    const kargoFirmasi = kargoFirmasiIstendi
      ? String(govde.kargoFirmasi ?? '').trim() || null
      : undefined;

    if (kargoFirmasi && !GECERLI_FIRMALAR.has(kargoFirmasi)) {
      return NextResponse.json({ error: 'Tanınmayan kargo firması' }, { status: 400 });
    }

    const kargoTakipNo =
      govde.kargoTakipNo !== undefined ? takipNoTemizle(govde.kargoTakipNo) : undefined;

    const mevcut = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        orderNumber: true,
        status: true,
        deliveredAt: true,
        shippedAt: true,
        kargoFirmasi: true,
        kargoTakipNo: true,
      },
    });

    if (!mevcut) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    /**
     * Teslim ve kargo damgaları - iki farklı kural, sebepleri farklı.
     *
     * deliveredAt BİR KEZ yazılıyor. Cayma süresi sipariş tarihinden değil
     * teslim tarihinden sayılıyor; sipariş yanlışlıkla başka bir duruma
     * alınıp tekrar DELIVERED yapılırsa 14 günlük pencere baştan
     * başlamamalı - müşterinin hakkını kısaltırdı.
     *
     * shippedAt ise SHIPPED'a HER GEÇİŞTE yazılıyor. Burada korunacak bir
     * hak yok; korunması gereken doğruluk. Yönetici yanlışlıkla SHIPPED
     * yapıp geri alır ve gönderi asıl bir hafta sonra çıkarsa, müşteriye
     * "6 Eylül'de kargoya verildi" demek yanlış olurdu.
     */
    const kargoyaYeniVerildi = status === 'SHIPPED' && mevcut.status !== 'SHIPPED';
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(kargoFirmasi !== undefined ? { kargoFirmasi } : {}),
        ...(kargoTakipNo !== undefined ? { kargoTakipNo } : {}),
        ...(status === 'DELIVERED' && !mevcut.deliveredAt ? { deliveredAt: new Date() } : {}),
        ...(kargoyaYeniVerildi ? { shippedAt: new Date() } : {}),
      },
    });

    /**
     * Sipariş durumu ve kargo bilgisi müşteriye görünen, paraya dokunan
     * kayıtlar. Kimin ne zaman değiştirdiği iz bırakmalı; günlük artık
     * veritabanında (bkz. lib/audit-log.ts).
     */
    const degisiklikler: string[] = [];
    if (status !== undefined && status !== mevcut.status) {
      degisiklikler.push(`durum ${mevcut.status} -> ${status}`);
    }
    if (kargoFirmasi !== undefined && kargoFirmasi !== mevcut.kargoFirmasi) {
      degisiklikler.push(`kargo firması ${mevcut.kargoFirmasi ?? '-'} -> ${kargoFirmasi ?? '-'}`);
    }
    if (kargoTakipNo !== undefined && kargoTakipNo !== mevcut.kargoTakipNo) {
      degisiklikler.push(`takip no ${mevcut.kargoTakipNo ?? '-'} -> ${kargoTakipNo ?? '-'}`);
    }

    if (degisiklikler.length > 0) {
      await logAudit(
        'SIPARIS_GUNCELLEME',
        adminEpostasi(req) ?? 'bilinmeyen',
        'success',
        `${mevcut.orderNumber}: ${degisiklikler.join(', ')}`
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Sipariş güncellenemedi:', error);
    return NextResponse.json({ error: 'Sipariş güncellenemedi' }, { status: 500 });
  }
}
